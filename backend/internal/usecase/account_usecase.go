package usecase

import (
	"context"
	"strings"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type AccountUsecase struct {
	repo domain.AccountRepository
}

func NewAccountUsecase(repo domain.AccountRepository) *AccountUsecase {
	return &AccountUsecase{repo: repo}
}

type CreateAccountInput struct {
	Name     string `json:"name"`
	Currency string `json:"currency"`
	Balance  int64  `json:"balance"`
}

type UpdateAccountInput struct {
	Name     *string `json:"name"`
	Currency *string `json:"currency"`
	Balance  *int64  `json:"balance"`
}

func (u *AccountUsecase) Create(ctx context.Context, userID string, input CreateAccountInput) (*domain.Account, error) {
	// Validate name
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, domain.ErrInvalidAccount
	}

	// Validate and normalize currency
	currency := strings.ToUpper(strings.TrimSpace(input.Currency))
	if currency == "" {
		currency = "EUR"
	}

	// Check if account already exists
	exists, err := u.repo.ExistsByUserIDNameAndCurrency(ctx, userID, name, currency)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrDuplicateEntry
	}

	account := &domain.Account{
		UserID:   userID,
		Name:     name,
		Currency: currency,
		Balance:  input.Balance,
	}

	// Use transactional create to ensure currency is created if needed
	if err := u.repo.CreateTransactional(ctx, account); err != nil {
		return nil, err
	}

	return account, nil
}

func (u *AccountUsecase) GetByID(ctx context.Context, userID string, id int64) (*domain.Account, error) {
	account, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if account.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	return account, nil
}

func (u *AccountUsecase) List(ctx context.Context, userID string) ([]*domain.Account, error) {
	return u.repo.GetByUserID(ctx, userID)
}

func (u *AccountUsecase) Update(ctx context.Context, userID string, id int64, input UpdateAccountInput) (*domain.Account, error) {
	// Get existing account
	account, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if account.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	// Apply partial updates
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return nil, domain.ErrInvalidAccount
		}
		account.Name = name
	}

	if input.Currency != nil {
		currency := strings.ToUpper(strings.TrimSpace(*input.Currency))
		if currency == "" {
			return nil, domain.ErrInvalidCurrency
		}
		account.Currency = currency
	}

	if input.Balance != nil {
		account.Balance = *input.Balance
	}

	// Check for duplicate after update
	exists, err := u.repo.ExistsByUserIDNameAndCurrency(ctx, userID, account.Name, account.Currency)
	if err != nil {
		return nil, err
	}

	currentAccount, _ := u.repo.GetByUserIDNameAndCurrency(ctx, userID, account.Name, account.Currency)
	if exists && (currentAccount == nil || currentAccount.ID != account.ID) {
		return nil, domain.ErrDuplicateEntry
	}

	if err := u.repo.Update(ctx, account); err != nil {
		return nil, err
	}

	return account, nil
}

func (u *AccountUsecase) Delete(ctx context.Context, userID string, id int64) error {
	// Get existing account
	account, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Ownership check
	if account.UserID != userID {
		return domain.ErrOwnershipViolation
	}

	return u.repo.Delete(ctx, id)
}
