-- Initial database schema for Budget App

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    transaction_at DATETIME NOT NULL,
    metadata JSON DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
