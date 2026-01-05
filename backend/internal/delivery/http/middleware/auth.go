package middleware

import (
	"net/http"
	"strings"

	"github.com/budget-app/backend/pkg/firebase"
	"github.com/labstack/echo/v4"
)

type AuthMiddleware struct {
	firebaseAuth *firebase.FirebaseAuth
}

func NewAuthMiddleware(firebaseAuth *firebase.FirebaseAuth) *AuthMiddleware {
	return &AuthMiddleware{firebaseAuth: firebaseAuth}
}

func (m *AuthMiddleware) Authenticate(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "invalid authorization header format",
			})
		}

		token, err := m.firebaseAuth.VerifyIDToken(c.Request().Context(), parts[1])
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "invalid token",
			})
		}

		// Set user ID in context
		c.Set("user_id", token.UID)
		c.Set("user_email", token.Claims["email"])

		return next(c)
	}
}
