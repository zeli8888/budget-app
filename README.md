# Personal Budget Management System

![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat&logo=firebase)

A lightweight, high-performance personal budget application designed for resource-constrained environments. It features a **React/TypeScript** frontend and a **Go** backend, implementing **Clean Architecture** to ensure scalability and maintainability.

The system is built to run on low-memory VPS instances by utilizing **SQLite** with efficient memory management, while still providing flexible "NoSQL-like" capabilities for transaction metadata.

## 🌟 Functional Overview

This application provides a secure way for users to:
1.  **Track Finances**: Record income and expenses with precise currency handling.
2.  **Filter & Search**: Retrieve transactions based on custom date ranges, categories, or payment methods.
3.  **Analyze Habits**: View statistical breakdowns of spending habits over specific periods.
4.  **Flexible Metadata**: Attach arbitrary tags, memos, or location data to any transaction without altering the database schema.

## 🗄️ Database Schema & Data Models

The project uses **SQLite**. To ensure data integrity and flexibility, the schema combines structured relational columns with a JSON column for dynamic attributes.

### `transactions` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Auto-incrementing primary key. |
| `user_id` | `TEXT` | Firebase UID to enforce data isolation per user. |
| `amount` | `INTEGER` | Stored in **cents/smallest unit** to avoid floating-point errors (e.g., $10.50 -> 1050). |
| `currency` | `TEXT` | ISO 4217 Currency Code (e.g., `USD`, `CNY`, `EUR`). |
| `type` | `TEXT` | Transaction type: `income` or `expense`. |
| `category` | `TEXT` | E.g., `Food`, `Transport`, `Salary`. Can be customized by users.|
| `payment_method`| `TEXT` | E.g., `Credit Card`, `Cash`, `Alipay`. Can be customized by users.|
| `transaction_at`| `DATETIME` | The actual time the transaction occurred. |
| `metadata` | `JSON` | **Flexible attributes**. Stores optional data like description, tags, location, or receipts. |

## 🔌 API Endpoints & Business Logic

The backend exposes a RESTful API. Below is the mapping of Controller Endpoints to the underlying Business Logic (Usecase Layer).

### 1. Transaction Management

#### `POST /api/v1/transactions`
*   **Description**: Create a new transaction.
*   **Payload**: Amount, Currency, Type, Category, PaymentMethod, Date, Metadata (JSON).
*   **Business Logic**:
    *   **Validation**: Ensure amount > 0 and date is valid.
    *   **Normalization**: Convert currency strings to uppercase.
    *   **Ownership**: Bind the record to the authenticated Firebase UID from the context.

#### `GET /api/v1/transactions`
*   **Description**: Retrieve a list of transactions with filtering.
*   **Query Params**: `start_date`, `end_date`, `type`, `limit`, `cursor` (pagination).
*   **Business Logic**:
    *   **Filtering**: dynamic SQL generation based on provided date ranges (e.g., "Get all expenses from last month").
    *   **Pagination**: Implements cursor-based pagination for performance on large datasets.
    *   **Deserialization**: Parses the `metadata` JSON column back into a Go map/struct for the frontend.

#### `PUT /api/v1/transactions/:id`
*   **Description**: Update an existing transaction.
*   **Business Logic**:
    *   **Security**: Verifies that the `user_id` of the existing record matches the requester before allowing updates.
    *   **Partial Update**: Allows updating specific fields (e.g., fixing a typo in the description) without overwriting the whole record.

#### `DELETE /api/v1/transactions/:id`
*   **Description**: Remove a transaction.
*   **Business Logic**:
    *   **Hard Delete**: Permanently removes the row from SQLite to save space (appropriate for a personal app).
    *   **Security**: Strict ownership check via Firebase UID.

### 2. Analytics & Reporting

#### `GET /api/v1/stats/summary`
*   **Description**: Get total income, total expense, and net balance for a specific period.
*   **Query Params**: `start_date`, `end_date`.
*   **Business Logic**:
    *   **Aggregation**: Calculates `SUM(amount)` grouped by `type`.
    *   **Performance**: Uses Go routines (if dataset is large) to calculate Income and Expense totals concurrently.

#### `GET /api/v1/stats/category`
*   **Description**: Breakdown of spending by category (for pie charts).
*   **Business Logic**:
    *   **Grouping**: Aggregates expenses by `category` column.
    *   **Sorting**: Returns categories sorted by total spend descending.

## 🏗 Architecture

The project follows **Clean Architecture** to maintain separation of concerns:

```text
budget-app/
├── backend/
│   ├── cmd/api/            # Application Entry Point
│   ├── internal/
│   │   ├── domain/         # Structs: Transaction, StatSummary
│   │   ├── usecase/        # Logic: Validation, Calculation, Ownership checks
│   │   ├── repository/     # Data: SQLite implementation
│   │   └── delivery/http/  # Transport: Echo handlers, Request parsing
│   ├── pkg/
│   │   ├── firebase/       # Firebase Auth client
│   │   └── database/       # SQLite connection
│   └── ...
├── frontend/               # React + TypeScript application
├── docker-compose.yml      # Container orchestration
├── Jenkinsfile             # CI/CD pipeline
└── .env.example            # Environment template
```

## 🛠 Tech Stack Decisions

*   **Go (Backend)**: Chosen for its low memory footprint (10-30MB RAM) and high concurrency performance, making it ideal for the target micro-server environment.
*   **SQLite (Database)**: Selected to avoid the memory overhead of running a dedicated DB process (like MySQL/Postgres). The database lives in a single file, simplifying backups.
*   **JSON Column**: Used to store variable attributes (like tags or detailed memos) without needing complex join tables, offering a "NoSQL" experience within SQL.
*   **Firebase Auth**: Offloads the complex security burden of user authentication (JWT handling, password storage) to Google infrastructure.

## 🚀 Getting Started

### Prerequisites
*   Go 1.21+
*   Node.js 18+
*   Firebase Project Credentials

### Backend Setup
1.  Navigate to `backend/`.
2.  Copy `.env.example` to `.env` and add your Firebase credentials path.
3.  Run the server:
    ```bash
    go run cmd/api/main.go
    ```

### Frontend Setup
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Start the dev server:
    ```bash
    npm start
    ```

### Docker Setup
1.  Copy `.env.example` to `.env` and configure.
2.  Run with Docker Compose:
    ```bash
    docker-compose up -d
    ```

## 📦 Deployment

The project includes a Jenkinsfile for CI/CD automation. Configure your Jenkins server with the appropriate credentials and webhook triggers.
