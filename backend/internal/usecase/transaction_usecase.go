package usecase

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/budget-app/backend/internal/domain"
)

type TransactionUsecase struct {
	repo domain.TransactionRepository
}

func NewTransactionUsecase(repo domain.TransactionRepository) *TransactionUsecase {
	return &TransactionUsecase{repo: repo}
}

type CreateTransactionInput struct {
	Amount        float64         `json:"amount"`
	Currency      string          `json:"currency"`
	Type          string          `json:"type"`
	Category      string          `json:"category"`
	PaymentMethod string          `json:"payment_method"`
	TransactionAt string          `json:"transaction_at"`
	Metadata      json.RawMessage `json:"metadata"`
}

type UpdateTransactionInput struct {
	Amount        *float64         `json:"amount"`
	Currency      *string          `json:"currency"`
	Type          *string          `json:"type"`
	Category      *string          `json:"category"`
	PaymentMethod *string          `json:"payment_method"`
	TransactionAt *string          `json:"transaction_at"`
	Metadata      *json.RawMessage `json:"metadata"`
}

func (u *TransactionUsecase) Create(userID string, input CreateTransactionInput) (*domain.Transaction, error) {
	// Validate amount
	if input.Amount <= 0 {
		return nil, domain.ErrInvalidAmount
	}

	// Validate type
	txType := domain.TransactionType(strings.ToLower(input.Type))
	if txType != domain.TransactionTypeIncome && txType != domain.TransactionTypeExpense {
		return nil, domain.ErrInvalidType
	}

	// Parse date
	transactionAt, err := time.Parse(time.RFC3339, input.TransactionAt)
	if err != nil {
		// Try alternative format
		transactionAt, err = time.Parse("2006-01-02", input.TransactionAt)
		if err != nil {
			return nil, domain.ErrInvalidDate
		}
	}

	// Normalize currency
	currency := strings.ToUpper(input.Currency)
	if currency == "" {
		currency = "USD"
	}

	// Default payment method
	paymentMethod := input.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "Cash"
	}

	// Convert amount to cents
	amountCents := int64(input.Amount * 100)

	tx := &domain.Transaction{
		UserID:        userID,
		Amount:        amountCents,
		Currency:      currency,
		Type:          txType,
		Category:      input.Category,
		PaymentMethod: paymentMethod,
		TransactionAt: transactionAt,
		Metadata:      input.Metadata,
	}

	if err := u.repo.Create(tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (u *TransactionUsecase) GetByID(userID string, id int64) (*domain.Transaction, error) {
	tx, err := u.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if tx.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	return tx, nil
}

func (u *TransactionUsecase) List(filter domain.TransactionFilter) ([]*domain.Transaction, error) {
	return u.repo.GetByUserID(filter)
}

func (u *TransactionUsecase) Update(userID string, id int64, input UpdateTransactionInput) (*domain.Transaction, error) {
	// Get existing transaction
	tx, err := u.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if tx.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	// Apply partial updates
	if input.Amount != nil {
		if *input.Amount <= 0 {
			return nil, domain.ErrInvalidAmount
		}
		tx.Amount = int64(*input.Amount * 100)
	}

	if input.Currency != nil {
		tx.Currency = strings.ToUpper(*input.Currency)
	}

	if input.Type != nil {
		txType := domain.TransactionType(strings.ToLower(*input.Type))
		if txType != domain.TransactionTypeIncome && txType != domain.TransactionTypeExpense {
			return nil, domain.ErrInvalidType
		}
		tx.Type = txType
	}

	if input.Category != nil {
		tx.Category = *input.Category
	}

	if input.PaymentMethod != nil {
		tx.PaymentMethod = *input.PaymentMethod
	}

	if input.TransactionAt != nil {
		transactionAt, err := time.Parse(time.RFC3339, *input.TransactionAt)
		if err != nil {
			transactionAt, err = time.Parse("2006-01-02", *input.TransactionAt)
			if err != nil {
				return nil, domain.ErrInvalidDate
			}
		}
		tx.TransactionAt = transactionAt
	}

	if input.Metadata != nil {
		tx.Metadata = *input.Metadata
	}

	if err := u.repo.Update(tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (u *TransactionUsecase) Delete(userID string, id int64) error {
	// Get existing transaction
	tx, err := u.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Ownership check
	if tx.UserID != userID {
		return domain.ErrOwnershipViolation
	}

	return u.repo.Delete(id)
}
