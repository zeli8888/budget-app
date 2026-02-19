package domain

import "context"

type Account struct {
	ID       int64  `json:"id"`
	UserID   string `json:"user_id"`
	Name     string `json:"name"`
	Currency string `json:"currency"`
	Balance  int64  `json:"balance"`
}

type AccountRepository interface {
	Create(ctx context.Context, account *Account) error
	CreateTransactional(ctx context.Context, account *Account) error
	GetByID(ctx context.Context, id int64) (*Account, error)
	GetByUserID(ctx context.Context, userID string) ([]*Account, error)
	GetByUserIDAndName(ctx context.Context, userID string, name string) ([]*Account, error)
	GetByUserIDNameAndCurrency(ctx context.Context, userID string, name string, currency string) (*Account, error)
	Update(ctx context.Context, account *Account) error
	Delete(ctx context.Context, id int64) error
	UpdateBalance(ctx context.Context, id int64, amount int64) error
	ExistsByUserIDNameAndCurrency(ctx context.Context, userID string, name string, currency string) (bool, error)
}
