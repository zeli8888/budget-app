package domain

import "context"

type Category struct {
	ID     int64           `json:"id"`
	UserID string          `json:"user_id"`
	Name   string          `json:"name"`
	Type   TransactionType `json:"type"`
}

type CategoryRepository interface {
	Create(ctx context.Context, category *Category) error
	GetByID(ctx context.Context, id int64) (*Category, error)
	GetByUserID(ctx context.Context, userID string) ([]*Category, error)
	GetByUserIDAndType(ctx context.Context, userID string, txType TransactionType) ([]*Category, error)
	GetByUserIDNameAndType(ctx context.Context, userID string, name string, txType TransactionType) (*Category, error)
	Update(ctx context.Context, category *Category) error
	Delete(ctx context.Context, id int64) error
	ExistsByUserIDNameAndType(ctx context.Context, userID string, name string, txType TransactionType) (bool, error)
}
