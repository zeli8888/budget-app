package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/domain"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
)

type TransactionHandler struct {
	usecase *usecase.TransactionUsecase
}

func NewTransactionHandler(usecase *usecase.TransactionUsecase) *TransactionHandler {
	return &TransactionHandler{usecase: usecase}
}

func (h *TransactionHandler) Create(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	var input usecase.CreateTransactionInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	tx, err := h.usecase.Create(ctx, userID, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, tx)
}

func (h *TransactionHandler) Get(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid transaction id",
		})
	}

	tx, err := h.usecase.GetByID(ctx, userID, id)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, tx)
}

func (h *TransactionHandler) List(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	filter := domain.TransactionFilter{
		UserID: userID,
	}

	// Parse query parameters
	if startDate := c.QueryParam("start_date"); startDate != "" {
		t, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			filter.StartDate = &t
		}
	}

	if endDate := c.QueryParam("end_date"); endDate != "" {
		t, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			// Set to end of day
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filter.EndDate = &t
		}
	}

	if currency := c.QueryParam("currency"); currency != "" {
		currency = strings.ToUpper(currency)
		filter.Currency = &currency
	}

	if txType := c.QueryParam("type"); txType != "" {
		t := domain.TransactionType(txType)
		filter.Type = &t
	}

	if category := c.QueryParam("category"); category != "" {
		filter.Category = &category
	}

	if paymentMethod := c.QueryParam("payment_method"); paymentMethod != "" {
		filter.PaymentMethod = &paymentMethod
	}

	if limit := c.QueryParam("limit"); limit != "" {
		l, err := strconv.Atoi(limit)
		if err == nil {
			filter.Limit = l
		}
	}

	if cursor := c.QueryParam("cursor"); cursor != "" {
		cur, err := strconv.ParseInt(cursor, 10, 64)
		if err == nil {
			filter.Cursor = &cur
		}
	}

	transactions, err := h.usecase.List(ctx, filter)
	if err != nil {
		return handleError(c, err)
	}

	// Determine next cursor
	var nextCursor *int64
	if len(transactions) > 0 && filter.Limit > 0 && len(transactions) == filter.Limit {
		lastID := transactions[len(transactions)-1].ID
		nextCursor = &lastID
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":        transactions,
		"next_cursor": nextCursor,
	})
}

func (h *TransactionHandler) Update(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid transaction id",
		})
	}

	var input usecase.UpdateTransactionInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	tx, err := h.usecase.Update(ctx, userID, id, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, tx)
}

func (h *TransactionHandler) Delete(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid transaction id",
		})
	}

	if err := h.usecase.Delete(ctx, userID, id); err != nil {
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}

func handleError(c echo.Context, err error) error {
	switch err {
	case domain.ErrNotFound:
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "resource not found",
		})
	case domain.ErrOwnershipViolation:
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "you do not have permission to access this resource",
		})
	case domain.ErrInvalidAmount:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "amount must be greater than 0",
		})
	case domain.ErrInvalidType:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "type must be 'income' or 'expense'",
		})
	case domain.ErrInvalidDate:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid date format, use RFC3339 or YYYY-MM-DD",
		})
	case domain.ErrDuplicateEntry:
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "duplicate entry",
		})
	case domain.ErrInvalidCurrency:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid currency code",
		})
	case domain.ErrInvalidCategory:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid category name",
		})
	case domain.ErrInvalidAccount:
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid account name",
		})
	default:
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
	}
}
