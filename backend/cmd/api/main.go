package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/zeli8888/budget-app/backend/internal/delivery/http/handler"
	"github.com/zeli8888/budget-app/backend/internal/delivery/http/middleware"
	"github.com/zeli8888/budget-app/backend/internal/repository/sqlite"
	"github.com/zeli8888/budget-app/backend/internal/usecase"
	"github.com/zeli8888/budget-app/backend/pkg/database"
	"github.com/zeli8888/budget-app/backend/pkg/firebase"
)

func main() {
	// Load configuration
	port := getEnv("PORT", "8002")
	dbPath := getEnv("DATABASE_PATH", "./data/budget.db")
	firebaseCredPath := getEnv("FIREBASE_CREDENTIALS_PATH", "./firebase-private-key.json")
	corsOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://zeli8888.ddns.net")
	contextPath := getEnv("CONTEXT_PATH", "/budget")

	// Initialize database
	db, err := database.NewSQLiteDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Firebase Auth
	firebaseAuth, err := firebase.NewFirebaseAuth(context.Background(), firebaseCredPath)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase Auth: %v", err)
	}

	// Initialize repositories
	transactionRepo := sqlite.NewTransactionRepository(db)

	// Initialize usecases
	transactionUsecase := usecase.NewTransactionUsecase(transactionRepo)
	statsUsecase := usecase.NewStatsUsecase(transactionRepo)

	// Initialize Echo
	e := echo.New()
	e.HideBanner = true

	// Middleware
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins:     strings.Split(corsOrigins, ","),
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	// Health check
	budget := e.Group(contextPath)
	budget.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})

	// API routes
	api := budget.Group("/api/v1")

	// Auth middleware
	authMiddleware := middleware.NewAuthMiddleware(firebaseAuth)

	// Protected routes
	protected := api.Group("")
	protected.Use(authMiddleware.Authenticate)

	// Initialize handlers
	transactionHandler := handler.NewTransactionHandler(transactionUsecase)
	statsHandler := handler.NewStatsHandler(statsUsecase)

	// Transaction routes
	protected.POST("/transactions", transactionHandler.Create)
	protected.GET("/transactions", transactionHandler.List)
	protected.GET("/transactions/:id", transactionHandler.Get)
	protected.PUT("/transactions/:id", transactionHandler.Update)
	protected.DELETE("/transactions/:id", transactionHandler.Delete)

	// Stats routes
	protected.GET("/stats/summary", statsHandler.GetSummary)
	protected.GET("/stats/category", statsHandler.GetCategoryBreakdown)

	// Start server
	go func() {
		if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
