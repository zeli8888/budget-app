#!/bin/bash

# ==========================================
# Configuration
# ==========================================
BASE_URL="http://localhost:8002/budget"
API_URL="$BASE_URL/api/v1"
# The backdoor token defined in your Go code
TOKEN="Bearer debug-token"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== Starting API Integration Tests ===${NC}"
echo -e "Target: $BASE_URL"
echo -e "Token: $TOKEN\n"

# ==========================================
# 1. Health Check
# ==========================================
echo -e "${CYAN}[1] Testing Health Check (Public)...${NC}"
curl -s "$BASE_URL/health" | grep "healthy" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Health check passed${NC}"
else
    echo -e "${RED}FAILED: Server might be down or not returning 'healthy'${NC}"
    exit 1
fi

# ==========================================
# 2. Security / Auth Tests
# ==========================================
echo -e "\n${CYAN}[2] Testing Authentication Failures (Expect 401)...${NC}"

# Case A: Missing Header
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/transactions")
if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}SUCCESS: Request without header rejected (401)${NC}"
else
    echo -e "${RED}FAILED: Request without header got $HTTP_CODE${NC}"
fi

# Case B: Invalid Token
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer bad-token" "$API_URL/transactions")
if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}SUCCESS: Request with invalid token rejected (401)${NC}"
else
    echo -e "${RED}FAILED: Invalid token request got $HTTP_CODE${NC}"
fi

# ==========================================
# 3. Currency CRUD Tests
# ==========================================
echo -e "\n${CYAN}=== Currency CRUD Tests ===${NC}"

# Create Currency
echo -e "\n${CYAN}[3.1] Testing Create Currency (POST)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/currencies" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "USD"}')

CURRENCY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$CURRENCY_ID" ]; then
    echo -e "${GREEN}SUCCESS: Created Currency ID: $CURRENCY_ID${NC}"
else
    echo -e "${RED}FAILED: Could not create currency${NC}"
    echo "Response: $RESPONSE"
fi

# Create duplicate currency (should fail)
echo -e "\n${CYAN}[3.2] Testing Duplicate Currency (Expect 409)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/currencies" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "USD"}')

if [ "$HTTP_CODE" == "409" ]; then
    echo -e "${GREEN}SUCCESS: Duplicate currency rejected (409)${NC}"
else
    echo -e "${RED}FAILED: Duplicate currency got $HTTP_CODE${NC}"
fi

# List Currencies
echo -e "\n${CYAN}[3.3] Testing List Currencies (GET)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/currencies" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "USD" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Currency list contains USD${NC}"
else
    echo -e "${RED}FAILED: Currency list does not contain USD${NC}"
fi

# Get Currency by ID
echo -e "\n${CYAN}[3.4] Testing Get Currency (GET ID)...${NC}"
if [ -n "$CURRENCY_ID" ]; then
    RESPONSE=$(curl -s -X GET "$API_URL/currencies/$CURRENCY_ID" -H "Authorization: $TOKEN")
    echo $RESPONSE | grep "USD" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Got currency by ID${NC}"
    else
        echo -e "${RED}FAILED: Could not get currency by ID${NC}"
    fi
fi

# Update Currency
echo -e "\n${CYAN}[3.5] Testing Update Currency (PUT)...${NC}"
if [ -n "$CURRENCY_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/currencies/$CURRENCY_ID" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"code": "GBP"}')
    echo $RESPONSE | grep "GBP" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Updated currency to GBP${NC}"
    else
        echo -e "${RED}FAILED: Could not update currency${NC}"
    fi
fi

# ==========================================
# 4. Category CRUD Tests
# ==========================================
echo -e "\n${CYAN}=== Category CRUD Tests ===${NC}"

# Create Category
echo -e "\n${CYAN}[4.1] Testing Create Category (POST)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/categories" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Groceries", "type": "expense"}')

CATEGORY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$CATEGORY_ID" ]; then
    echo -e "${GREEN}SUCCESS: Created Category ID: $CATEGORY_ID${NC}"
else
    echo -e "${RED}FAILED: Could not create category${NC}"
    echo "Response: $RESPONSE"
fi

# Create duplicate category (should fail)
echo -e "\n${CYAN}[4.2] Testing Duplicate Category (Expect 409)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/categories" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Groceries", "type": "expense"}')

if [ "$HTTP_CODE" == "409" ]; then
    echo -e "${GREEN}SUCCESS: Duplicate category rejected (409)${NC}"
else
    echo -e "${RED}FAILED: Duplicate category got $HTTP_CODE${NC}"
fi

# Same name different type (should succeed)
echo -e "\n${CYAN}[4.3] Testing Same Name Different Type (Should succeed)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/categories" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Groceries", "type": "income"}')

CATEGORY_ID_INCOME=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$CATEGORY_ID_INCOME" ]; then
    echo -e "${GREEN}SUCCESS: Created income category with same name${NC}"
else
    echo -e "${RED}FAILED: Could not create income category${NC}"
fi

# List Categories
echo -e "\n${CYAN}[4.4] Testing List Categories (GET)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/categories" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "Groceries" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Category list contains Groceries${NC}"
else
    echo -e "${RED}FAILED: Category list does not contain Groceries${NC}"
fi

# List Categories by Type
echo -e "\n${CYAN}[4.5] Testing List Categories by Type (GET ?type=expense)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/categories?type=expense" -H "Authorization: $TOKEN")
echo $RESPONSE | grep '"type":"expense"' > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Filtered categories by expense type${NC}"
else
    echo -e "${RED}FAILED: Could not filter categories by type${NC}"
fi

# Update Category
echo -e "\n${CYAN}[4.6] Testing Update Category (PUT)...${NC}"
if [ -n "$CATEGORY_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/categories/$CATEGORY_ID" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "Food & Dining"}')
    echo $RESPONSE | grep "Food & Dining" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Updated category name${NC}"
    else
        echo -e "${RED}FAILED: Could not update category${NC}"
    fi
fi

# ==========================================
# 5. Account CRUD Tests
# ==========================================
echo -e "\n${CYAN}=== Account CRUD Tests ===${NC}"

# Create Account (should also create currency if not exists)
echo -e "\n${CYAN}[5.1] Testing Create Account with new currency (POST)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/accounts" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Savings Account", "currency": "JPY", "balance": 100000}')

ACCOUNT_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$ACCOUNT_ID" ]; then
    echo -e "${GREEN}SUCCESS: Created Account ID: $ACCOUNT_ID${NC}"
else
    echo -e "${RED}FAILED: Could not create account${NC}"
    echo "Response: $RESPONSE"
fi

# Verify JPY currency was created
echo -e "\n${CYAN}[5.2] Verifying JPY currency was auto-created...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/currencies" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "JPY" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: JPY currency was auto-created${NC}"
else
    echo -e "${RED}FAILED: JPY currency was not auto-created${NC}"
fi

# Create duplicate account (should fail)
echo -e "\n${CYAN}[5.3] Testing Duplicate Account (Expect 409)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/accounts" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Savings Account", "currency": "JPY", "balance": 0}')

if [ "$HTTP_CODE" == "409" ]; then
    echo -e "${GREEN}SUCCESS: Duplicate account rejected (409)${NC}"
else
    echo -e "${RED}FAILED: Duplicate account got $HTTP_CODE${NC}"
fi

# Same name different currency (should succeed)
echo -e "\n${CYAN}[5.4] Testing Same Name Different Currency (Should succeed)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/accounts" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Savings Account", "currency": "EUR", "balance": 5000}')

ACCOUNT_ID_EUR=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$ACCOUNT_ID_EUR" ]; then
    echo -e "${GREEN}SUCCESS: Created EUR account with same name${NC}"
else
    echo -e "${RED}FAILED: Could not create EUR account${NC}"
fi

# List Accounts
echo -e "\n${CYAN}[5.5] Testing List Accounts (GET)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/accounts" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "Savings Account" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Account list contains Savings Account${NC}"
else
    echo -e "${RED}FAILED: Account list does not contain Savings Account${NC}"
fi

# Update Account
echo -e "\n${CYAN}[5.6] Testing Update Account (PUT)...${NC}"
if [ -n "$ACCOUNT_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/accounts/$ACCOUNT_ID" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"balance": 150000}')
    echo $RESPONSE | grep '"balance":150000' > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Updated account balance${NC}"
    else
        echo -e "${RED}FAILED: Could not update account${NC}"
        echo "Response: $RESPONSE"
    fi
fi

# ==========================================
# 6. Transaction Tests (with auto-creation)
# ==========================================
echo -e "\n${CYAN}=== Transaction Tests (with auto-creation) ===${NC}"

# Create Transaction with NEW category and account
echo -e "\n${CYAN}[6.1] Testing Create Transaction with new category and account...${NC}"
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

RESPONSE=$(curl -s -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 150.50,
    \"currency\": \"CHF\",
    \"type\": \"expense\",
    \"category\": \"Entertainment\",
    \"payment_method\": \"Credit Card\",
    \"transaction_at\": \"$CURRENT_DATE\",
    \"metadata\": {\"note\": \"Movie tickets\"}
}")

TX_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$TX_ID" ]; then
    echo -e "${GREEN}SUCCESS: Created Transaction ID: $TX_ID${NC}"
else
    echo -e "${RED}FAILED: Could not create transaction${NC}"
    echo "Response: $RESPONSE"
fi

# Verify category was auto-created
echo -e "\n${CYAN}[6.2] Verifying Entertainment category was auto-created...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/categories?type=expense" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "Entertainment" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Entertainment category was auto-created${NC}"
else
    echo -e "${RED}FAILED: Entertainment category was not auto-created${NC}"
fi

# Verify currency was auto-created
echo -e "\n${CYAN}[6.3] Verifying CHF currency was auto-created...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/currencies" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "CHF" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: CHF currency was auto-created${NC}"
else
    echo -e "${RED}FAILED: CHF currency was not auto-created${NC}"
fi

# Verify account was auto-created with correct balance
echo -e "\n${CYAN}[6.4] Verifying Credit Card CHF account was auto-created...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/accounts" -H "Authorization: $TOKEN")
echo $RESPONSE | grep '"name":"Credit Card"' > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Credit Card account was auto-created${NC}"
    # Check balance is negative (expense)
    echo $RESPONSE | grep -E '"balance":-[0-9]+' > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Account balance is negative (expense deducted)${NC}"
    else
        echo -e "${YELLOW}WARNING: Could not verify negative balance${NC}"
    fi
else
    echo -e "${RED}FAILED: Credit Card account was not auto-created${NC}"
fi

# Create income transaction to test balance increase
echo -e "\n${CYAN}[6.5] Testing Create Income Transaction (balance should increase)...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 500,
    \"currency\": \"CHF\",
    \"type\": \"income\",
    \"category\": \"Salary\",
    \"payment_method\": \"Credit Card\",
    \"transaction_at\": \"$CURRENT_DATE\",
    \"metadata\": {\"note\": \"Bonus\"}
}")

TX_ID_INCOME=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$TX_ID_INCOME" ]; then
    echo -e "${GREEN}SUCCESS: Created Income Transaction ID: $TX_ID_INCOME${NC}"
else
    echo -e "${RED}FAILED: Could not create income transaction${NC}"
fi

# Verify Salary category was created for income type
echo -e "\n${CYAN}[6.6] Verifying Salary category was auto-created for income...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/categories?type=income" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "Salary" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Salary category was auto-created for income${NC}"
else
    echo -e "${RED}FAILED: Salary category was not auto-created${NC}"
fi

# ==========================================
# 7. Standard Transaction CRUD
# ==========================================
echo -e "\n${CYAN}=== Standard Transaction CRUD ===${NC}"

# List Transactions
echo -e "\n${CYAN}[7.1] Testing List Transactions (GET)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/transactions?limit=5" -H "Authorization: $TOKEN")
echo $RESPONSE | grep "\"id\":$TX_ID" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: List contains the newly created transaction${NC}"
else
    echo -e "${RED}FAILED: Transaction not found in list${NC}"
fi

# Get Single Transaction
echo -e "\n${CYAN}[7.2] Testing Get Transaction Details (GET ID)...${NC}"
if [ -n "$TX_ID" ]; then
    RESPONSE=$(curl -s -X GET "$API_URL/transactions/$TX_ID" -H "Authorization: $TOKEN")
    echo $RESPONSE | grep "Entertainment" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Got transaction details${NC}"
    else
        echo -e "${RED}FAILED: Could not get transaction details${NC}"
    fi
fi

# Update Transaction
echo -e "\n${CYAN}[7.3] Testing Update Transaction (PUT)...${NC}"
if [ -n "$TX_ID" ]; then
    RESPONSE=$(curl -s -X PUT "$API_URL/transactions/$TX_ID" \
      -H "Authorization: $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 200, "category": "Movies"}')
    echo $RESPONSE | grep '"amount":20000' > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: Updated transaction amount${NC}"
    else
        echo -e "${RED}FAILED: Could not update transaction${NC}"
        echo "Response: $RESPONSE"
    fi
fi

# ==========================================
# 8. Statistics
# ==========================================
echo -e "\n${CYAN}=== Statistics Tests ===${NC}"

# Test Summary
echo -e "\n${CYAN}[8.1] Testing Stats Summary...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/stats/summary" -H "Authorization: $TOKEN")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}SUCCESS: Summary Endpoint OK (200)${NC}"
else
    echo -e "${RED}FAILED: Summary Endpoint returned $HTTP_CODE${NC}"
fi

# Test Category Breakdown
echo -e "\n${CYAN}[8.2] Testing Stats Category Breakdown...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/stats/category?type=expense" -H "Authorization: $TOKEN")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}SUCCESS: Category Endpoint OK (200)${NC}"
else
    echo -e "${RED}FAILED: Category Endpoint returned $HTTP_CODE${NC}"
fi

# ==========================================
# 9. Cleanup - Delete Tests
# ==========================================
echo -e "\n${CYAN}=== Cleanup Tests ===${NC}"

# Delete Transaction
echo -e "\n${CYAN}[9.1] Testing Delete Transaction...${NC}"
if [ -n "$TX_ID" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/transactions/$TX_ID" -H "Authorization: $TOKEN")
    if [ "$HTTP_CODE" == "204" ]; then
        echo -e "${GREEN}SUCCESS: Deleted transaction (204)${NC}"
    else
        echo -e "${RED}FAILED: Delete transaction failed with code $HTTP_CODE${NC}"
    fi
fi

# Verify Transaction Deletion
echo -e "\n${CYAN}[9.2] Verifying Transaction Deletion...${NC}"
if [ -n "$TX_ID" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/transactions/$TX_ID" -H "Authorization: $TOKEN")
    if [ "$HTTP_CODE" == "404" ]; then
        echo -e "${GREEN}SUCCESS: Transaction not found (404) as expected${NC}"
    else
        echo -e "${RED}FAILED: Transaction still exists (Code: $HTTP_CODE)${NC}"
    fi
fi

# Delete Income Transaction
if [ -n "$TX_ID_INCOME" ]; then
    curl -s -o /dev/null -X DELETE "$API_URL/transactions/$TX_ID_INCOME" -H "Authorization: $TOKEN"
fi

# Delete Category
echo -e "\n${CYAN}[9.3] Testing Delete Category...${NC}"
if [ -n "$CATEGORY_ID" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/categories/$CATEGORY_ID" -H "Authorization: $TOKEN")
    if [ "$HTTP_CODE" == "204" ]; then
        echo -e "${GREEN}SUCCESS: Deleted category (204)${NC}"
    else
        echo -e "${RED}FAILED: Delete category failed with code $HTTP_CODE${NC}"
    fi
fi

# Delete income category
if [ -n "$CATEGORY_ID_INCOME" ]; then
    curl -s -o /dev/null -X DELETE "$API_URL/categories/$CATEGORY_ID_INCOME" -H "Authorization: $TOKEN"
fi

# Delete Currency
echo -e "\n${CYAN}[9.4] Testing Delete Currency...${NC}"
if [ -n "$CURRENCY_ID" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/currencies/$CURRENCY_ID" -H "Authorization: $TOKEN")
    if [ "$HTTP_CODE" == "204" ]; then
        echo -e "${GREEN}SUCCESS: Deleted currency (204)${NC}"
    else
        echo -e "${RED}FAILED: Delete currency failed with code $HTTP_CODE${NC}"
    fi
fi

# Delete Account
echo -e "\n${CYAN}[9.5] Testing Delete Account...${NC}"
if [ -n "$ACCOUNT_ID" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/accounts/$ACCOUNT_ID" -H "Authorization: $TOKEN")
    if [ "$HTTP_CODE" == "204" ]; then
        echo -e "${GREEN}SUCCESS: Deleted account (204)${NC}"
    else
        echo -e "${RED}FAILED: Delete account failed with code $HTTP_CODE${NC}"
    fi
fi

# Delete EUR account
if [ -n "$ACCOUNT_ID_EUR" ]; then
    curl -s -o /dev/null -X DELETE "$API_URL/accounts/$ACCOUNT_ID_EUR" -H "Authorization: $TOKEN"
fi

# ==========================================
# 10. Edge Cases
# ==========================================
echo -e "\n${CYAN}=== Edge Case Tests ===${NC}"

# Invalid transaction type
echo -e "\n${CYAN}[10.1] Testing Invalid Transaction Type (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 100,
    \"currency\": \"EUR\",
    \"type\": \"invalid\",
    \"category\": \"Test\",
    \"payment_method\": \"Cash\",
    \"transaction_at\": \"$CURRENT_DATE\"
}")

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Invalid type rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Invalid type got $HTTP_CODE${NC}"
fi

# Invalid amount (zero)
echo -e "\n${CYAN}[10.2] Testing Zero Amount (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 0,
    \"currency\": \"EUR\",
    \"type\": \"expense\",
    \"category\": \"Test\",
    \"payment_method\": \"Cash\",
    \"transaction_at\": \"$CURRENT_DATE\"
}")

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Zero amount rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Zero amount got $HTTP_CODE${NC}"
fi

# Invalid amount (negative)
echo -e "\n${CYAN}[10.3] Testing Negative Amount (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": -50,
    \"currency\": \"EUR\",
    \"type\": \"expense\",
    \"category\": \"Test\",
    \"payment_method\": \"Cash\",
    \"transaction_at\": \"$CURRENT_DATE\"
}")

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Negative amount rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Negative amount got $HTTP_CODE${NC}"
fi

# Empty category name
echo -e "\n${CYAN}[10.4] Testing Empty Category Name (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/categories" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "type": "expense"}')

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Empty category name rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Empty category name got $HTTP_CODE${NC}"
fi

# Empty currency code
echo -e "\n${CYAN}[10.5] Testing Empty Currency Code (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/currencies" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": ""}')

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Empty currency code rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Empty currency code got $HTTP_CODE${NC}"
fi

# Empty account name
echo -e "\n${CYAN}[10.6] Testing Empty Account Name (Expect 400)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/accounts" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "currency": "EUR"}')

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}SUCCESS: Empty account name rejected (400)${NC}"
else
    echo -e "${RED}FAILED: Empty account name got $HTTP_CODE${NC}"
fi

# Get non-existent resource
echo -e "\n${CYAN}[10.7] Testing Get Non-existent Transaction (Expect 404)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/transactions/999999" -H "Authorization: $TOKEN")
if [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}SUCCESS: Non-existent transaction returns 404${NC}"
else
    echo -e "${RED}FAILED: Non-existent transaction got $HTTP_CODE${NC}"
fi

echo -e "\n${CYAN}=== All Tests Completed ===${NC}"
