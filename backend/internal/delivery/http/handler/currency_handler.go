package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
)

type CurrencyHandler struct {
	usecase *usecase.CurrencyUsecase
}

func NewCurrencyHandler(usecase *usecase.CurrencyUsecase) *CurrencyHandler {
	return &CurrencyHandler{usecase: usecase}
}

func (h *CurrencyHandler) Create(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	var input usecase.CreateCurrencyInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	currency, err := h.usecase.Create(ctx, userID, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, currency)
}

func (h *CurrencyHandler) Get(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid currency id",
		})
	}

	currency, err := h.usecase.GetByID(ctx, userID, id)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, currency)
}

func (h *CurrencyHandler) List(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	currencies, err := h.usecase.List(ctx, userID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": currencies,
	})
}

func (h *CurrencyHandler) Update(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid currency id",
		})
	}

	var input usecase.UpdateCurrencyInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	currency, err := h.usecase.Update(ctx, userID, id, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, currency)
}

func (h *CurrencyHandler) Delete(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid currency id",
		})
	}

	if err := h.usecase.Delete(ctx, userID, id); err != nil {
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
