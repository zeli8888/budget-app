package usecase

import (
	"time"

	"github.com/budget-app/backend/internal/domain"
)

type StatsUsecase struct {
	repo domain.TransactionRepository
}

func NewStatsUsecase(repo domain.TransactionRepository) *StatsUsecase {
	return &StatsUsecase{repo: repo}
}

func (u *StatsUsecase) GetSummary(userID string, startDate, endDate time.Time) (*domain.StatsSummary, error) {
	return u.repo.GetSummary(userID, startDate, endDate)
}

func (u *StatsUsecase) GetCategoryBreakdown(userID string, startDate, endDate time.Time, txType domain.TransactionType) ([]*domain.CategoryStat, error) {
	return u.repo.GetCategoryBreakdown(userID, startDate, endDate, txType)
}
