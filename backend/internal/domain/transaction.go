package domain

import (
	"context"
	"encoding/json"
	"time"
)

type TransactionType string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

type Transaction struct {
	ID            int64           `json:"id"`
	UserID        string          `json:"user_id"`
	Amount        int64           `json:"amount"` // Stored in cents
	Currency      string          `json:"currency"`
	Type          TransactionType `json:"type"`
	Category      string          `json:"category"`
	PaymentMethod string          `json:"payment_method"`
	TransactionAt time.Time       `json:"transaction_at"`
	Metadata      json.RawMessage `json:"metadata"`
}

type TransactionFilter struct {
	UserID    string
	StartDate *time.Time
	EndDate   *time.Time
	Type      *TransactionType
	Category  *string
	Limit     int
	Cursor    *int64
}

type TransactionRepository interface {
	Create(ctx context.Context, tx *Transaction) error
	GetByID(ctx context.Context, id int64) (*Transaction, error)
	GetByUserID(ctx context.Context, filter TransactionFilter) ([]*Transaction, error)
	Update(ctx context.Context, tx *Transaction) error
	Delete(ctx context.Context, id int64) error
	GetSummary(ctx context.Context, userID string, startDate, endDate time.Time) ([]*StatsSummary, error)
	GetCategoryBreakdown(ctx context.Context, userID string, startDate, endDate time.Time, txType TransactionType) (map[string][]*CategoryStat, error)
	CreateTransactional(ctx context.Context, tx *Transaction) error
}
