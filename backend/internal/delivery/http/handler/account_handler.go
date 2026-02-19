package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
)

type AccountHandler struct {
	usecase *usecase.AccountUsecase
}

func NewAccountHandler(usecase *usecase.AccountUsecase) *AccountHandler {
	return &AccountHandler{usecase: usecase}
}

func (h *AccountHandler) Create(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	var input usecase.CreateAccountInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	account, err := h.usecase.Create(ctx, userID, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, account)
}

func (h *AccountHandler) Get(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid account id",
		})
	}

	account, err := h.usecase.GetByID(ctx, userID, id)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) List(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	accounts, err := h.usecase.List(ctx, userID)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": accounts,
	})
}

func (h *AccountHandler) Update(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid account id",
		})
	}

	var input usecase.UpdateAccountInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	account, err := h.usecase.Update(ctx, userID, id, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) Delete(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid account id",
		})
	}

	if err := h.usecase.Delete(ctx, userID, id); err != nil {
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
