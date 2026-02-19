package usecase

import (
	"context"
	"strings"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type CurrencyUsecase struct {
	repo domain.CurrencyRepository
}

func NewCurrencyUsecase(repo domain.CurrencyRepository) *CurrencyUsecase {
	return &CurrencyUsecase{repo: repo}
}

type CreateCurrencyInput struct {
	Code string `json:"code"`
}

type UpdateCurrencyInput struct {
	Code *string `json:"code"`
}

func (u *CurrencyUsecase) Create(ctx context.Context, userID string, input CreateCurrencyInput) (*domain.Currency, error) {
	// Validate and normalize code
	code := strings.ToUpper(strings.TrimSpace(input.Code))
	if code == "" {
		return nil, domain.ErrInvalidCurrency
	}

	// Check if currency already exists
	exists, err := u.repo.ExistsByUserIDAndCode(ctx, userID, code)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrDuplicateEntry
	}

	currency := &domain.Currency{
		UserID: userID,
		Code:   code,
	}

	if err := u.repo.Create(ctx, currency); err != nil {
		return nil, err
	}

	return currency, nil
}

func (u *CurrencyUsecase) GetByID(ctx context.Context, userID string, id int64) (*domain.Currency, error) {
	currency, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if currency.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	return currency, nil
}

func (u *CurrencyUsecase) List(ctx context.Context, userID string) ([]*domain.Currency, error) {
	return u.repo.GetByUserID(ctx, userID)
}

func (u *CurrencyUsecase) Update(ctx context.Context, userID string, id int64, input UpdateCurrencyInput) (*domain.Currency, error) {
	// Get existing currency
	currency, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if currency.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	// Apply partial updates
	if input.Code != nil {
		code := strings.ToUpper(strings.TrimSpace(*input.Code))
		if code == "" {
			return nil, domain.ErrInvalidCurrency
		}

		// Check for duplicate
		exists, err := u.repo.ExistsByUserIDAndCode(ctx, userID, code)
		if err != nil {
			return nil, err
		}

		currentCurrency, _ := u.repo.GetByUserIDAndCode(ctx, userID, code)
		if exists && (currentCurrency == nil || currentCurrency.ID != currency.ID) {
			return nil, domain.ErrDuplicateEntry
		}

		currency.Code = code
	}

	if err := u.repo.Update(ctx, currency); err != nil {
		return nil, err
	}

	return currency, nil
}

func (u *CurrencyUsecase) Delete(ctx context.Context, userID string, id int64) error {
	// Get existing currency
	currency, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Ownership check
	if currency.UserID != userID {
		return domain.ErrOwnershipViolation
	}

	return u.repo.Delete(ctx, id)
}
