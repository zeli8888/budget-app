# Personal Budget Management System

![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat&logo=firebase)

A lightweight, high-performance personal budget application designed for resource-constrained environments. It features a modern **React/TypeScript** frontend powered by **Vite** and **TailwindCSS**, and a **Go** backend implementing **Clean Architecture** to ensure scalability and maintainability.

The system is built to run on low-memory VPS instances by utilizing **SQLite** with efficient memory management, while providing advanced multi-currency tracking, customizable entities, and flexible "NoSQL-like" capabilities for transaction metadata.

## 🌟 Functional Overview

This application provides a secure and highly customizable way for users to:
1.  **Fully Custom Entities**: Users can create custom **categories**, **currencies**, and **accounts (payment methods)** without being constrained to standard lists.
2.  **Smart Multi-Currency Tracking**: Set custom exchange rates to convert transactions from various currencies into a single unified currency for effortless global wealth tracking.
3.  **Automated Account Balances**: Track balances across different accounts (payment methods). Creating or updating a transaction automatically adjusts the corresponding account balance.
4.  **Filter & Search**: Retrieve transactions based on custom date ranges, categories, currencies, or payment methods.
5.  **Analyze Habits**: View statistical breakdowns of spending and income habits over specific periods.
6.  **Flexible Metadata**: Attach arbitrary tags, memos, or location data to any transaction without altering the database schema.

## 🗄️ Database Schema & Data Models

The project uses **SQLite**. To maximize flexibility, I intentionally avoid strict foreign keys, meaning if you delete a custom category or currency, your historical transaction records remain completely intact.

### 1. `transactions` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Auto-incrementing primary key. |
| `user_id` | `TEXT` | Firebase UID to enforce data isolation per user. |
| `amount` | `INTEGER` | Stored in **cents/smallest unit** to avoid floating-point errors. |
| `currency` | `TEXT` | Code mapping to user's custom currency (e.g., `USD`, `EUR`). |
| `type` | `TEXT` | Transaction type: `income` or `expense`. |
| `category` | `TEXT` | User-defined category name (e.g., `Food`, `Salary`). |
| `payment_method`| `TEXT` | Maps to the user's `account` name (e.g., `Credit Card`). |
| `transaction_at`| `DATETIME` | The actual time the transaction occurred. |
| `metadata` | `JSON` | **Flexible attributes**. Stores optional data (tags, location). |

### 2. `accounts` Table
Tracks real-time balances per payment method and currency.
*   `id`, `user_id`, `name` (payment method name), `currency`, `balance` (auto-updated INTEGER).
*   *Unique Constraint:* `(user_id, name, currency)`

### 3. `categories` Table
Stores user-defined custom categories.
*   `id`, `user_id`, `name`, `type` (`income` or `expense`).
*   *Unique Constraint:* `(user_id, name, type)`

### 4. `currencies` Table
Stores user-defined custom currencies.
*   `id`, `user_id`, `code`.
*   *Unique Constraint:* `(user_id, code)`

### ⚡ Performance Indexes
The database utilizes heavily optimized indexes for frequently queried patterns:
*   `transactions`: Indexed by `user_id`, `(user_id, transaction_at)`, `(user_id, type)`, `(user_id, category)`.
*   User Preferences: Indexed by `user_id` across `categories`, `currencies`, and `accounts`.

## 🔌 API Endpoints & Business Logic

The backend exposes a RESTful API. Below is the mapping of Controller Endpoints to the underlying Business Logic.

### 1. Transaction Management (`/api/v1/transactions`)
*   **`POST /`**: Create a transaction. Automatically updates the linked account's balance.
*   **`GET /`**: Retrieve a list of transactions. Supports extensive filtering: `start_date`, `end_date`, `currency`, `type`, `category`, `payment_method`, `limit`, and `cursor` (for high-performance pagination).
*   **`PUT /:id`**: Update an existing transaction. Automatically recalculates and adjusts the affected account balances.
*   **`DELETE /:id`**: Remove a transaction and revert the balance adjustment on the associated account.

### 2. Analytics & Reporting (`/api/v1/stats`)
*   **`GET /summary`**: Get total income, total expense, and net balance for a specific period (`start_date`, `end_date`).
*   **`GET /category`**: Breakdown of spending/income by category (for pie charts). Filterable by `start_date`, `end_date`, and `type`.

### 3. Custom Entities Management
These endpoints allow users to fully customize their financial environment. All follow standard CRUD (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`).
*   **Currencies (`/api/v1/currencies`)**: Manage custom currencies.
*   **Categories (`/api/v1/categories`)**: Manage custom categories (filterable by `type` in the `GET` list endpoint).
*   **Accounts (`/api/v1/accounts`)**: Manage accounts/payment methods and view their running balances.

## 🏗 Architecture

The project follows **Clean Architecture** to maintain separation of concerns:

```text
budget-app/
├── backend/
│   ├── cmd/api/            # Application Entry Point
│   ├── internal/
│   │   ├── domain/         # Structs: Transaction, Account, Filters
│   │   ├── usecase/        # Logic: Balance recalculation, validation
│   │   ├── repository/     # Data: SQLite implementation
│   │   └── delivery/http/  # Transport: Echo handlers, Request parsing
│   ├── pkg/
│   │   ├── firebase/       # Firebase Auth client
│   │   └── database/       # SQLite connection
│   └── ...
├── frontend/               # React + TypeScript + Vite + Tailwind
└── .env.example            # Environment template
```

## 🛠 Tech Stack Decisions

*   **Vite & TailwindCSS (Frontend)**: Transitioned to Vite for significantly faster HMR and build times. TailwindCSS is used for a utility-first, highly responsive, and maintainable styling system.
*   **Go (Backend)**: Chosen for its low memory footprint (10-30MB RAM) and high concurrency performance, making it ideal for the target micro-server environment.
*   **SQLite (Database)**: Selected to avoid the memory overhead of running a dedicated DB process. The database lives in a single file, simplifying backups.
*   **No Foreign Keys**: Deliberately omitted database-level foreign keys for `categories`, `currencies`, and `payment_method`. This offers maximum flexibility: users can write records easily, and deleting a custom category or currency will *not* break or cascade-delete historical transaction records.
*   **JSON Column**: Used to store variable attributes without needing complex join tables, offering a "NoSQL" experience within SQL.

## 🚀 Getting Started

### Prerequisites
*   Go 1.21+
*   Node.js 18+
*   Firebase Project Credentials

### Backend Setup
1.  Navigate to `backend/`.
2.  Check env variables in [main.go](backend/cmd/api/main.go)
3.  Install dependencies: `go mod tidy`.
4.  Run the server:
    ```bash
    go run cmd/api/main.go
    ```

### Frontend Setup
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Ensure your `.env` contains the correct Firebase config and Backend API URLs.
4.  Start the Vite development server:
    ```bash
    npm start
    ```