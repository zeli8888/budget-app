#!/bin/bash

# ==========================================
# Configuration
# ==========================================
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"
# The backdoor token defined in your Go code
TOKEN="Bearer debug-token"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
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
# 3. Create Transaction
# ==========================================
echo -e "\n${CYAN}[3] Testing Create Transaction (POST)...${NC}"

# Current timestamp
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

RESPONSE=$(curl -s -X POST "$API_URL/transactions" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 5000,
    \"currency\": \"EUR\",
    \"type\": \"expense\",
    \"category\": \"Food\",
    \"payment_method\": \"Credit Card\",
    \"transaction_at\": \"$CURRENT_DATE\",
    \"metadata\": {\"note\": \"Lunch test\"}
}")

# Extract ID using grep/cut (avoiding jq dependency)
# Assumes response format {"id":123, ...}
TX_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)

if [ -n "$TX_ID" ]; then
    echo -e "${GREEN}SUCCESS: Created Transaction ID: $TX_ID${NC}"
    # echo "Raw Response: $RESPONSE"
else
    echo -e "${RED}FAILED: Could not create transaction${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# ==========================================
# 4. List Transactions
# ==========================================
echo -e "\n${CYAN}[4] Testing List Transactions (GET)...${NC}"
curl -s -X GET "$API_URL/transactions?limit=5" \
  -H "Authorization: $TOKEN" \
  | grep "\"id\":$TX_ID" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: List contains the newly created ID${NC}"
else
    echo -e "${RED}FAILED: The new ID was not found in the list${NC}"
fi

# ==========================================
# 5. Get Single Transaction
# ==========================================
echo -e "\n${CYAN}[5] Testing Get Transaction Details (GET ID)...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/transactions/$TX_ID" \
  -H "Authorization: $TOKEN")

echo $RESPONSE | grep "\"amount\":5000" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Data matches (Amount is 5000)${NC}"
else
    echo -e "${RED}FAILED: Data mismatch or not found${NC}"
    echo $RESPONSE
fi

# ==========================================
# 6. Update Transaction
# ==========================================
echo -e "\n${CYAN}[6] Testing Update Transaction (PUT)...${NC}"
RESPONSE=$(curl -s -X PUT "$API_URL/transactions/$TX_ID" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 9900,
    \"category\": \"Groceries\"
}")

echo $RESPONSE | grep "\"amount\":9900" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Update confirmed (Amount changed to 9900)${NC}"
else
    echo -e "${RED}FAILED: Update failed${NC}"
    echo $RESPONSE
fi

# ==========================================
# 7. Statistics
# ==========================================
echo -e "\n${CYAN}[7] Testing Stats Endpoints...${NC}"

# Test Summary
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/stats/summary" -H "Authorization: $TOKEN")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}SUCCESS: Summary Endpoint OK (200)${NC}"
else
    echo -e "${RED}FAILED: Summary Endpoint returned $HTTP_CODE${NC}"
fi

# Test Category Breakdown
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/stats/category?type=expense" -H "Authorization: $TOKEN")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}SUCCESS: Category Endpoint OK (200)${NC}"
else
    echo -e "${RED}FAILED: Category Endpoint returned $HTTP_CODE${NC}"
fi

# ==========================================
# 8. Delete Transaction
# ==========================================
echo -e "\n${CYAN}[8] Testing Delete Transaction (DELETE)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/transactions/$TX_ID" \
  -H "Authorization: $TOKEN")

if [ "$HTTP_CODE" == "204" ]; then
    echo -e "${GREEN}SUCCESS: Deleted (204 No Content)${NC}"
else
    echo -e "${RED}FAILED: Delete failed with code $HTTP_CODE${NC}"
fi

# ==========================================
# 9. Verify Deletion
# ==========================================
echo -e "\n${CYAN}[9] Verifying Deletion (GET should fail)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/transactions/$TX_ID" \
  -H "Authorization: $TOKEN")

if [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}SUCCESS: Transaction not found (404) as expected${NC}"
else
    echo -e "${RED}FAILED: Transaction still exists or server error (Code: $HTTP_CODE)${NC}"
fi

echo -e "\n${CYAN}=== Test Completed ===${NC}"
