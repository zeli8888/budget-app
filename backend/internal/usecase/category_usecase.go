package usecase

import (
	"context"
	"strings"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type CategoryUsecase struct {
	repo domain.CategoryRepository
}

func NewCategoryUsecase(repo domain.CategoryRepository) *CategoryUsecase {
	return &CategoryUsecase{repo: repo}
}

type CreateCategoryInput struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type UpdateCategoryInput struct {
	Name *string `json:"name"`
	Type *string `json:"type"`
}

func (u *CategoryUsecase) Create(ctx context.Context, userID string, input CreateCategoryInput) (*domain.Category, error) {
	// Validate name
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, domain.ErrInvalidCategory
	}

	// Validate type
	txType := domain.TransactionType(strings.ToLower(input.Type))
	if txType != domain.TransactionTypeIncome && txType != domain.TransactionTypeExpense {
		return nil, domain.ErrInvalidType
	}

	// Check if category already exists
	exists, err := u.repo.ExistsByUserIDNameAndType(ctx, userID, name, txType)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrDuplicateEntry
	}

	category := &domain.Category{
		UserID: userID,
		Name:   name,
		Type:   txType,
	}

	if err := u.repo.Create(ctx, category); err != nil {
		return nil, err
	}

	return category, nil
}

func (u *CategoryUsecase) GetByID(ctx context.Context, userID string, id int64) (*domain.Category, error) {
	category, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if category.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	return category, nil
}

func (u *CategoryUsecase) List(ctx context.Context, userID string, txType *domain.TransactionType) ([]*domain.Category, error) {
	if txType != nil {
		return u.repo.GetByUserIDAndType(ctx, userID, *txType)
	}
	return u.repo.GetByUserID(ctx, userID)
}

func (u *CategoryUsecase) Update(ctx context.Context, userID string, id int64, input UpdateCategoryInput) (*domain.Category, error) {
	// Get existing category
	category, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Ownership check
	if category.UserID != userID {
		return nil, domain.ErrOwnershipViolation
	}

	// Apply partial updates
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return nil, domain.ErrInvalidCategory
		}
		category.Name = name
	}

	if input.Type != nil {
		txType := domain.TransactionType(strings.ToLower(*input.Type))
		if txType != domain.TransactionTypeIncome && txType != domain.TransactionTypeExpense {
			return nil, domain.ErrInvalidType
		}
		category.Type = txType
	}

	// Check for duplicate after update
	exists, err := u.repo.ExistsByUserIDNameAndType(ctx, userID, category.Name, category.Type)
	if err != nil {
		return nil, err
	}

	// Get current category to check if it's the same one
	currentCategory, _ := u.repo.GetByUserIDNameAndType(ctx, userID, category.Name, category.Type)
	if exists && (currentCategory == nil || currentCategory.ID != category.ID) {
		return nil, domain.ErrDuplicateEntry
	}

	if err := u.repo.Update(ctx, category); err != nil {
		return nil, err
	}

	return category, nil
}

func (u *CategoryUsecase) Delete(ctx context.Context, userID string, id int64) error {
	// Get existing category
	category, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Ownership check
	if category.UserID != userID {
		return domain.ErrOwnershipViolation
	}

	return u.repo.Delete(ctx, id)
}
