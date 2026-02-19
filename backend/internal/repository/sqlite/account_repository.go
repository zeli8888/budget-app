package sqlite

import (
	"context"
	"database/sql"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type AccountRepository struct {
	db *sql.DB
}

func NewAccountRepository(db *sql.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Create(ctx context.Context, account *domain.Account) error {
	query := `
		INSERT INTO accounts (user_id, name, currency, balance)
		VALUES (?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(ctx, query,
		account.UserID,
		account.Name,
		account.Currency,
		account.Balance,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	account.ID = id
	return nil
}

func (r *AccountRepository) CreateTransactional(ctx context.Context, account *domain.Account) error {
	dbTx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer dbTx.Rollback()

	// 1. Check if currency exists, create if not
	var currencyExists bool
	err = dbTx.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM currencies WHERE user_id = ? AND code = ?)`,
		account.UserID, account.Currency,
	).Scan(&currencyExists)
	if err != nil {
		return err
	}

	if !currencyExists {
		_, err = dbTx.ExecContext(ctx,
			`INSERT INTO currencies (user_id, code) VALUES (?, ?)`,
			account.UserID, account.Currency,
		)
		if err != nil {
			return err
		}
	}

	// 2. Create the account
	result, err := dbTx.ExecContext(ctx,
		`INSERT INTO accounts (user_id, name, currency, balance) VALUES (?, ?, ?, ?)`,
		account.UserID,
		account.Name,
		account.Currency,
		account.Balance,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	account.ID = id

	return dbTx.Commit()
}

func (r *AccountRepository) GetByID(ctx context.Context, id int64) (*domain.Account, error) {
	query := `
		SELECT id, user_id, name, currency, balance
		FROM accounts
		WHERE id = ?
	`

	account := &domain.Account{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&account.ID,
		&account.UserID,
		&account.Name,
		&account.Currency,
		&account.Balance,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return account, nil
}

func (r *AccountRepository) GetByUserID(ctx context.Context, userID string) ([]*domain.Account, error) {
	query := `
		SELECT id, user_id, name, currency, balance
		FROM accounts
		WHERE user_id = ?
		ORDER BY name, currency
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []*domain.Account
	for rows.Next() {
		account := &domain.Account{}
		err := rows.Scan(
			&account.ID,
			&account.UserID,
			&account.Name,
			&account.Currency,
			&account.Balance,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}

	return accounts, nil
}

func (r *AccountRepository) GetByUserIDAndName(ctx context.Context, userID string, name string) ([]*domain.Account, error) {
	query := `
		SELECT id, user_id, name, currency, balance
		FROM accounts
		WHERE user_id = ? AND name = ?
		ORDER BY currency
	`

	rows, err := r.db.QueryContext(ctx, query, userID, name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []*domain.Account
	for rows.Next() {
		account := &domain.Account{}
		err := rows.Scan(
			&account.ID,
			&account.UserID,
			&account.Name,
			&account.Currency,
			&account.Balance,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}

	return accounts, nil
}

func (r *AccountRepository) GetByUserIDNameAndCurrency(ctx context.Context, userID string, name string, currency string) (*domain.Account, error) {
	query := `
		SELECT id, user_id, name, currency, balance
		FROM accounts
		WHERE user_id = ? AND name = ? AND currency = ?
	`

	account := &domain.Account{}
	err := r.db.QueryRowContext(ctx, query, userID, name, currency).Scan(
		&account.ID,
		&account.UserID,
		&account.Name,
		&account.Currency,
		&account.Balance,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return account, nil
}

func (r *AccountRepository) Update(ctx context.Context, account *domain.Account) error {
	query := `
		UPDATE accounts
		SET name = ?, currency = ?, balance = ?
		WHERE id = ?
	`

	result, err := r.db.ExecContext(ctx, query,
		account.Name,
		account.Currency,
		account.Balance,
		account.ID,
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

func (r *AccountRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM accounts WHERE id = ?`

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

func (r *AccountRepository) UpdateBalance(ctx context.Context, id int64, amount int64) error {
	query := `
		UPDATE accounts
		SET balance = balance + ?
		WHERE id = ?
	`

	result, err := r.db.ExecContext(ctx, query, amount, id)
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

func (r *AccountRepository) ExistsByUserIDNameAndCurrency(ctx context.Context, userID string, name string, currency string) (bool, error) {
	query := `
		SELECT EXISTS(SELECT 1 FROM accounts WHERE user_id = ? AND name = ? AND currency = ?)
	`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, userID, name, currency).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
