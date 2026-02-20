package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/domain"
)

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
