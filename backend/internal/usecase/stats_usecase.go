package usecase

import (
	"context"
	"time"

	"github.com/zeli8888/budget-app/backend/internal/domain"
)

type StatsUsecase struct {
	repo domain.TransactionRepository
}

func NewStatsUsecase(repo domain.TransactionRepository) *StatsUsecase {
	return &StatsUsecase{repo: repo}
}

func (u *StatsUsecase) GetSummary(ctx context.Context, userID string, startDate, endDate time.Time) (*domain.StatsSummary, error) {
	return u.repo.GetSummary(ctx, userID, startDate, endDate)
}

func (u *StatsUsecase) GetCategoryBreakdown(ctx context.Context, userID string, startDate, endDate time.Time, txType domain.TransactionType) ([]*domain.CategoryStat, error) {
	return u.repo.GetCategoryBreakdown(ctx, userID, startDate, endDate, txType)
}
