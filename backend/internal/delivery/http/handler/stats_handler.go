package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/domain"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
)

type StatsHandler struct {
	usecase *usecase.StatsUsecase
}

func NewStatsHandler(usecase *usecase.StatsUsecase) *StatsHandler {
	return &StatsHandler{usecase: usecase}
}

func (h *StatsHandler) GetSummary(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	// Default to current month
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Parse query parameters
	if sd := c.QueryParam("start_date"); sd != "" {
		t, err := time.Parse("2006-01-02", sd)
		if err == nil {
			startDate = t
		}
	}

	if ed := c.QueryParam("end_date"); ed != "" {
		t, err := time.Parse("2006-01-02", ed)
		if err == nil {
			endDate = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		}
	}

	summary, err := h.usecase.GetSummary(ctx, userID, startDate, endDate)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to get summary",
		})
	}

	return c.JSON(http.StatusOK, summary)
}

func (h *StatsHandler) GetCategoryBreakdown(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	// Default to current month
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Default to expense
	txType := domain.TransactionTypeExpense

	// Parse query parameters
	if sd := c.QueryParam("start_date"); sd != "" {
		t, err := time.Parse("2006-01-02", sd)
		if err == nil {
			startDate = t
		}
	}

	if ed := c.QueryParam("end_date"); ed != "" {
		t, err := time.Parse("2006-01-02", ed)
		if err == nil {
			endDate = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		}
	}

	if t := c.QueryParam("type"); t != "" {
		if t == "income" {
			txType = domain.TransactionTypeIncome
		}
	}

	stats, err := h.usecase.GetCategoryBreakdown(ctx, userID, startDate, endDate, txType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to get category breakdown",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": stats,
		"type": txType,
	})
}
