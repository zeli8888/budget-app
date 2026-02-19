package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/zeli8888/budget-app/backend/internal/domain"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
)

type CategoryHandler struct {
	usecase *usecase.CategoryUsecase
}

func NewCategoryHandler(usecase *usecase.CategoryUsecase) *CategoryHandler {
	return &CategoryHandler{usecase: usecase}
}

func (h *CategoryHandler) Create(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	var input usecase.CreateCategoryInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	category, err := h.usecase.Create(ctx, userID, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) Get(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid category id",
		})
	}

	category, err := h.usecase.GetByID(ctx, userID, id)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) List(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	var txType *domain.TransactionType
	if t := c.QueryParam("type"); t != "" {
		tt := domain.TransactionType(t)
		txType = &tt
	}

	categories, err := h.usecase.List(ctx, userID, txType)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": categories,
	})
}

func (h *CategoryHandler) Update(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid category id",
		})
	}

	var input usecase.UpdateCategoryInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	category, err := h.usecase.Update(ctx, userID, id, input)
	if err != nil {
		return handleError(c, err)
	}

	return c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) Delete(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Get("user_id").(string)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid category id",
		})
	}

	if err := h.usecase.Delete(ctx, userID, id); err != nil {
		return handleError(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
