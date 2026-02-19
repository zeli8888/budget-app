package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(ctx context.Context, tx *domain.Transaction) error {
	query := `
		INSERT INTO transactions (user_id, amount, currency, type, category, payment_method, transaction_at, metadata)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	metadataJSON, err := json.Marshal(tx.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	result, err := r.db.ExecContext(ctx, query,
		tx.UserID,
		tx.Amount,
		tx.Currency,
		tx.Type,
		tx.Category,
		tx.PaymentMethod,
		tx.TransactionAt,
		string(metadataJSON),
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	tx.ID = id
	return nil
}

func (r *TransactionRepository) CreateTransactional(ctx context.Context, tx *domain.Transaction) error {
	dbTx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer dbTx.Rollback()

	// 1. Check if category exists, create if not
	var categoryExists bool
	err = dbTx.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM categories WHERE user_id = ? AND name = ? AND type = ?)`,
		tx.UserID, tx.Category, tx.Type,
	).Scan(&categoryExists)
	if err != nil {
		return err
	}

	if !categoryExists {
		_, err = dbTx.ExecContext(ctx,
			`INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)`,
			tx.UserID, tx.Category, tx.Type,
		)
		if err != nil {
			return err
		}
	}

	// 2. Check if currency exists, create if not
	var currencyExists bool
	err = dbTx.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM currencies WHERE user_id = ? AND code = ?)`,
		tx.UserID, tx.Currency,
	).Scan(&currencyExists)
	if err != nil {
		return err
	}

	if !currencyExists {
		_, err = dbTx.ExecContext(ctx,
			`INSERT INTO currencies (user_id, code) VALUES (?, ?)`,
			tx.UserID, tx.Currency,
		)
		if err != nil {
			return err
		}
	}

	// 3. Check if account exists, create if not, or update balance
	var accountID int64
	var accountBalance int64
	err = dbTx.QueryRowContext(ctx,
		`SELECT id, balance FROM accounts WHERE user_id = ? AND name = ? AND currency = ?`,
		tx.UserID, tx.PaymentMethod, tx.Currency,
	).Scan(&accountID, &accountBalance)

	if err == sql.ErrNoRows {
		// Account doesn't exist, create it with initial balance based on transaction type
		var initialBalance int64
		if tx.Type == domain.TransactionTypeIncome {
			initialBalance = tx.Amount
		} else {
			initialBalance = -tx.Amount
		}

		result, err := dbTx.ExecContext(ctx,
			`INSERT INTO accounts (user_id, name, currency, balance) VALUES (?, ?, ?, ?)`,
			tx.UserID, tx.PaymentMethod, tx.Currency, initialBalance,
		)
		if err != nil {
			return err
		}
		accountID, _ = result.LastInsertId()
	} else if err != nil {
		return err
	} else {
		// Account exists, update balance
		var newBalance int64
		if tx.Type == domain.TransactionTypeIncome {
			newBalance = accountBalance + tx.Amount
		} else {
			newBalance = accountBalance - tx.Amount
		}

		_, err = dbTx.ExecContext(ctx,
			`UPDATE accounts SET balance = ? WHERE id = ?`,
			newBalance, accountID,
		)
		if err != nil {
			return err
		}
	}

	// 4. Create the transaction
	metadataJSON, err := json.Marshal(tx.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	result, err := dbTx.ExecContext(ctx,
		`INSERT INTO transactions (user_id, amount, currency, type, category, payment_method, transaction_at, metadata)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		tx.UserID,
		tx.Amount,
		tx.Currency,
		tx.Type,
		tx.Category,
		tx.PaymentMethod,
		tx.TransactionAt,
		string(metadataJSON),
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	tx.ID = id

	return dbTx.Commit()
}

func (r *TransactionRepository) GetByID(ctx context.Context, id int64) (*domain.Transaction, error) {
	query := `
		SELECT id, user_id, amount, currency, type, category, payment_method, transaction_at, metadata
		FROM transactions
		WHERE id = ?
	`

	tx := &domain.Transaction{}
	var metadataStr string

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&tx.ID,
		&tx.UserID,
		&tx.Amount,
		&tx.Currency,
		&tx.Type,
		&tx.Category,
		&tx.PaymentMethod,
		&tx.TransactionAt,
		&metadataStr,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	tx.Metadata = json.RawMessage(metadataStr)
	return tx, nil
}

func (r *TransactionRepository) GetByUserID(ctx context.Context, filter domain.TransactionFilter) ([]*domain.Transaction, error) {
	var conditions []string
	var args []interface{}

	conditions = append(conditions, "user_id = ?")
	args = append(args, filter.UserID)

	if filter.StartDate != nil {
		conditions = append(conditions, "transaction_at >= ?")
		args = append(args, *filter.StartDate)
	}

	if filter.EndDate != nil {
		conditions = append(conditions, "transaction_at <= ?")
		args = append(args, *filter.EndDate)
	}

	if filter.Type != nil {
		conditions = append(conditions, "type = ?")
		args = append(args, *filter.Type)
	}

	if filter.Category != nil {
		conditions = append(conditions, "category = ?")
		args = append(args, *filter.Category)
	}

	if filter.Cursor != nil {
		conditions = append(conditions, "id < ?")
		args = append(args, *filter.Cursor)
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, amount, currency, type, category, payment_method, transaction_at, metadata
		FROM transactions
		WHERE %s
		ORDER BY transaction_at DESC, id DESC
		LIMIT ?
	`, strings.Join(conditions, " AND "))

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	args = append(args, limit)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*domain.Transaction
	for rows.Next() {
		tx := &domain.Transaction{}
		var metadataStr string

		err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Amount,
			&tx.Currency,
			&tx.Type,
			&tx.Category,
			&tx.PaymentMethod,
			&tx.TransactionAt,
			&metadataStr,
		)
		if err != nil {
			return nil, err
		}

		tx.Metadata = json.RawMessage(metadataStr)
		transactions = append(transactions, tx)
	}

	return transactions, nil
}

func (r *TransactionRepository) Update(ctx context.Context, tx *domain.Transaction) error {
	query := `
		UPDATE transactions
		SET amount = ?, currency = ?, type = ?, category = ?, payment_method = ?, transaction_at = ?, metadata = ?
		WHERE id = ?
	`

	metadataJSON, err := json.Marshal(tx.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	result, err := r.db.ExecContext(ctx, query,
		tx.Amount,
		tx.Currency,
		tx.Type,
		tx.Category,
		tx.PaymentMethod,
		tx.TransactionAt,
		string(metadataJSON),
		tx.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return domain.ErrNotFound
	}

	return nil
}

func (r *TransactionRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM transactions WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return domain.ErrNotFound
	}

	return nil
}

func (r *TransactionRepository) GetSummary(ctx context.Context, userID string, startDate, endDate time.Time) (*domain.StatsSummary, error) {
	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		FROM transactions
		WHERE user_id = ? AND transaction_at >= ? AND transaction_at <= ?
	`

	summary := &domain.StatsSummary{Currency: "EUR"}

	err := r.db.QueryRowContext(ctx, query, userID, startDate, endDate).Scan(
		&summary.TotalIncome,
		&summary.TotalExpense,
	)
	if err != nil {
		return nil, err
	}

	summary.NetBalance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

func (r *TransactionRepository) GetCategoryBreakdown(ctx context.Context, userID string, startDate, endDate time.Time, txType domain.TransactionType) ([]*domain.CategoryStat, error) {
	query := `
		SELECT category, SUM(amount) as total, COUNT(*) as count
		FROM transactions
		WHERE user_id = ? AND type = ? AND transaction_at >= ? AND transaction_at <= ?
		GROUP BY category
		ORDER BY total DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, txType, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*domain.CategoryStat
	var grandTotal int64

	for rows.Next() {
		stat := &domain.CategoryStat{}
		err := rows.Scan(&stat.Category, &stat.Total, &stat.Count)
		if err != nil {
			return nil, err
		}
		grandTotal += stat.Total
		stats = append(stats, stat)
	}

	// Calculate percentages
	for _, stat := range stats {
		if grandTotal > 0 {
			stat.Percentage = float64(stat.Total) / float64(grandTotal) * 100
		}
	}

	return stats, nil
}
