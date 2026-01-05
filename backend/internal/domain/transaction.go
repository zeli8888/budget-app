package domain

import (
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
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
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
	Create(tx *Transaction) error
	GetByID(id int64) (*Transaction, error)
	GetByUserID(filter TransactionFilter) ([]*Transaction, error)
	Update(tx *Transaction) error
	Delete(id int64) error
	GetSummary(userID string, startDate, endDate time.Time) (*StatsSummary, error)
	GetCategoryBreakdown(userID string, startDate, endDate time.Time, txType TransactionType) ([]*CategoryStat, error)
}
