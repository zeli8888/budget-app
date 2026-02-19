package sqlite

import (
	"context"
	"database/sql"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type CurrencyRepository struct {
	db *sql.DB
}

func NewCurrencyRepository(db *sql.DB) *CurrencyRepository {
	return &CurrencyRepository{db: db}
}

func (r *CurrencyRepository) Create(ctx context.Context, currency *domain.Currency) error {
	query := `
		INSERT INTO currencies (user_id, code)
		VALUES (?, ?)
	`

	result, err := r.db.ExecContext(ctx, query,
		currency.UserID,
		currency.Code,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	currency.ID = id
	return nil
}

func (r *CurrencyRepository) GetByID(ctx context.Context, id int64) (*domain.Currency, error) {
	query := `
		SELECT id, user_id, code
		FROM currencies
		WHERE id = ?
	`

	currency := &domain.Currency{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&currency.ID,
		&currency.UserID,
		&currency.Code,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return currency, nil
}

func (r *CurrencyRepository) GetByUserID(ctx context.Context, userID string) ([]*domain.Currency, error) {
	query := `
		SELECT id, user_id, code
		FROM currencies
		WHERE user_id = ?
		ORDER BY code
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currencies []*domain.Currency
	for rows.Next() {
		currency := &domain.Currency{}
		err := rows.Scan(
			&currency.ID,
			&currency.UserID,
			&currency.Code,
		)
		if err != nil {
			return nil, err
		}
		currencies = append(currencies, currency)
	}

	return currencies, nil
}

func (r *CurrencyRepository) GetByUserIDAndCode(ctx context.Context, userID string, code string) (*domain.Currency, error) {
	query := `
		SELECT id, user_id, code
		FROM currencies
		WHERE user_id = ? AND code = ?
	`

	currency := &domain.Currency{}
	err := r.db.QueryRowContext(ctx, query, userID, code).Scan(
		&currency.ID,
		&currency.UserID,
		&currency.Code,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return currency, nil
}

func (r *CurrencyRepository) Update(ctx context.Context, currency *domain.Currency) error {
	query := `
		UPDATE currencies
		SET code = ?
		WHERE id = ?
	`

	result, err := r.db.ExecContext(ctx, query,
		currency.Code,
		currency.ID,
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

func (r *CurrencyRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM currencies WHERE id = ?`

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

func (r *CurrencyRepository) ExistsByUserIDAndCode(ctx context.Context, userID string, code string) (bool, error) {
	query := `
		SELECT EXISTS(SELECT 1 FROM currencies WHERE user_id = ? AND code = ?)
	`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, userID, code).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
