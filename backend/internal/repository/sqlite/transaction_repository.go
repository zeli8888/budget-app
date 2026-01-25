package sqlite

import (
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

func (r *TransactionRepository) Create(tx *domain.Transaction) error {
	query := `
		INSERT INTO transactions (user_id, amount, currency, type, category, payment_method, transaction_at, metadata)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	metadataJSON, err := json.Marshal(tx.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	result, err := r.db.Exec(query,
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

func (r *TransactionRepository) GetByID(id int64) (*domain.Transaction, error) {
	query := `
		SELECT id, user_id, amount, currency, type, category, payment_method, transaction_at, metadata
		FROM transactions
		WHERE id = ?
	`

	tx := &domain.Transaction{}
	var metadataStr string

	err := r.db.QueryRow(query, id).Scan(
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

func (r *TransactionRepository) GetByUserID(filter domain.TransactionFilter) ([]*domain.Transaction, error) {
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

	rows, err := r.db.Query(query, args...)
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

func (r *TransactionRepository) Update(tx *domain.Transaction) error {
	query := `
		UPDATE transactions
		SET amount = ?, currency = ?, type = ?, category = ?, payment_method = ?, transaction_at = ?, metadata = ?
		WHERE id = ?
	`

	metadataJSON, err := json.Marshal(tx.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	result, err := r.db.Exec(query,
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

func (r *TransactionRepository) Delete(id int64) error {
	query := `DELETE FROM transactions WHERE id = ?`

	result, err := r.db.Exec(query, id)
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

func (r *TransactionRepository) GetSummary(userID string, startDate, endDate time.Time) (*domain.StatsSummary, error) {
	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		FROM transactions
		WHERE user_id = ? AND transaction_at >= ? AND transaction_at <= ?
	`

	summary := &domain.StatsSummary{Currency: "EUR"}

	err := r.db.QueryRow(query, userID, startDate, endDate).Scan(
		&summary.TotalIncome,
		&summary.TotalExpense,
	)
	if err != nil {
		return nil, err
	}

	summary.NetBalance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

func (r *TransactionRepository) GetCategoryBreakdown(userID string, startDate, endDate time.Time, txType domain.TransactionType) ([]*domain.CategoryStat, error) {
	query := `
		SELECT category, SUM(amount) as total, COUNT(*) as count
		FROM transactions
		WHERE user_id = ? AND type = ? AND transaction_at >= ? AND transaction_at <= ?
		GROUP BY category
		ORDER BY total DESC
	`

	rows, err := r.db.Query(query, userID, txType, startDate, endDate)
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
