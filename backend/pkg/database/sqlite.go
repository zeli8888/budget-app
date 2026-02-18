package database

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func NewSQLiteDB(dbPath string) (*sql.DB, error) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}

	// Set connection pool settings for low memory usage
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func RunMigrations(db *sql.DB) error {
	migrations := []string{
		// 1. Transactions Table (Existing)
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			currency TEXT NOT NULL DEFAULT 'EUR',
			type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
			category TEXT NOT NULL,
			payment_method TEXT NOT NULL DEFAULT 'Unknown',
			transaction_at DATETIME NOT NULL,
			metadata JSON DEFAULT '{}'
		)`,

		// 2. Custom Categories
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
			UNIQUE(user_id, name, type)
		)`,

		// 3. Custom Currencies
		`CREATE TABLE IF NOT EXISTS currencies (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			code TEXT NOT NULL,
			UNIQUE(user_id, code)
		)`,

		// 4. Accounts & Savings (Tracks balances per payment_method + currency)
		`CREATE TABLE IF NOT EXISTS accounts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			currency TEXT NOT NULL,
			balance INTEGER DEFAULT 0,
			UNIQUE(user_id, name, currency)
		)`,

		// Performance Indexes for Transactions
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_at)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category)`,

		// Performance Indexes for User Preferences (Queried often)
		`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_currencies_user ON currencies(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return err
		}
	}

	return nil
}
