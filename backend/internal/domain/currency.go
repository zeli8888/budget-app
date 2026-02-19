package domain

import "context"

type Currency struct {
	ID     int64  `json:"id"`
	UserID string `json:"user_id"`
	Code   string `json:"code"`
}

type CurrencyRepository interface {
	Create(ctx context.Context, currency *Currency) error
	GetByID(ctx context.Context, id int64) (*Currency, error)
	GetByUserID(ctx context.Context, userID string) ([]*Currency, error)
	GetByUserIDAndCode(ctx context.Context, userID string, code string) (*Currency, error)
	Update(ctx context.Context, currency *Currency) error
	Delete(ctx context.Context, id int64) error
	ExistsByUserIDAndCode(ctx context.Context, userID string, code string) (bool, error)
}
