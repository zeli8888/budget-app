package sqlite

import (
	"context"
	"database/sql"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, category *domain.Category) error {
	query := `
		INSERT INTO categories (user_id, name, type)
		VALUES (?, ?, ?)
	`

	result, err := r.db.ExecContext(ctx, query,
		category.UserID,
		category.Name,
		category.Type,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	category.ID = id
	return nil
}

func (r *CategoryRepository) GetByID(ctx context.Context, id int64) (*domain.Category, error) {
	query := `
		SELECT id, user_id, name, type
		FROM categories
		WHERE id = ?
	`

	category := &domain.Category{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&category.ID,
		&category.UserID,
		&category.Name,
		&category.Type,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *CategoryRepository) GetByUserID(ctx context.Context, userID string) ([]*domain.Category, error) {
	query := `
		SELECT id, user_id, name, type
		FROM categories
		WHERE user_id = ?
		ORDER BY type, name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		category := &domain.Category{}
		err := rows.Scan(
			&category.ID,
			&category.UserID,
			&category.Name,
			&category.Type,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (r *CategoryRepository) GetByUserIDAndType(ctx context.Context, userID string, txType domain.TransactionType) ([]*domain.Category, error) {
	query := `
		SELECT id, user_id, name, type
		FROM categories
		WHERE user_id = ? AND type = ?
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query, userID, txType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		category := &domain.Category{}
		err := rows.Scan(
			&category.ID,
			&category.UserID,
			&category.Name,
			&category.Type,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (r *CategoryRepository) GetByUserIDNameAndType(ctx context.Context, userID string, name string, txType domain.TransactionType) (*domain.Category, error) {
	query := `
		SELECT id, user_id, name, type
		FROM categories
		WHERE user_id = ? AND name = ? AND type = ?
	`

	category := &domain.Category{}
	err := r.db.QueryRowContext(ctx, query, userID, name, txType).Scan(
		&category.ID,
		&category.UserID,
		&category.Name,
		&category.Type,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *CategoryRepository) Update(ctx context.Context, category *domain.Category) error {
	query := `
		UPDATE categories
		SET name = ?, type = ?
		WHERE id = ?
	`

	result, err := r.db.ExecContext(ctx, query,
		category.Name,
		category.Type,
		category.ID,
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

func (r *CategoryRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM categories WHERE id = ?`

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

func (r *CategoryRepository) ExistsByUserIDNameAndType(ctx context.Context, userID string, name string, txType domain.TransactionType) (bool, error) {
	query := `
		SELECT EXISTS(SELECT 1 FROM categories WHERE user_id = ? AND name = ? AND type = ?)
	`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, userID, name, txType).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
