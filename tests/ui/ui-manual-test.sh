#!/bin/bash
# Aenea UI Manual Test Script
# Simple bash-based UI functionality verification

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Aenea UI Manual Test Suite${NC}"
echo "==============================="
echo ""

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local url="$2"
    local expected_pattern="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -n "Testing $test_name... "

    # Make HTTP request and capture response
    response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    http_code="${response: -3}"
    body="${response%???}"

    # Check HTTP status code
    if [ "$http_code" -eq 200 ]; then
        if [ -n "$expected_pattern" ]; then
            if echo "$body" | grep -q "$expected_pattern"; then
                echo -e "${GREEN}✅ PASS${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "${RED}❌ FAIL${NC} (Pattern not found: $expected_pattern)"
            fi
        else
            echo -e "${GREEN}✅ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    fi
}

run_json_test() {
    local test_name="$1"
    local url="$2"
    local json_key="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -n "Testing $test_name... "

    response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    http_code="${response: -3}"
    body="${response%???}"

    if [ "$http_code" -eq 200 ]; then
        if echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print('$json_key' in data)" 2>/dev/null | grep -q "True"; then
            echo -e "${GREEN}✅ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            # Show value
            value=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('$json_key', 'N/A'))" 2>/dev/null)
            echo "   📊 $json_key: $value"
        else
            echo -e "${RED}❌ FAIL${NC} (JSON key '$json_key' not found)"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    fi
}

# Test UI HTML page
echo -e "${BLUE}📱 UI Availability Tests${NC}"
run_test "UI HTML page" "$BASE_URL" "Aenea"
run_test "Dashboard title" "$BASE_URL" "Consciousness Dashboard"
run_test "React framework" "$BASE_URL" "React"
run_test "Socket.IO library" "$BASE_URL" "socket.io"
echo ""

# Test API endpoints
echo -e "${BLUE}🔌 API Endpoint Tests${NC}"
run_json_test "Consciousness state" "$BASE_URL/api/consciousness/state" "isRunning"
run_json_test "System clock" "$BASE_URL/api/consciousness/state" "systemClock"
run_json_test "Energy level" "$BASE_URL/api/consciousness/state" "energy"
run_json_test "Total questions" "$BASE_URL/api/consciousness/state" "totalQuestions"
echo ""

echo -e "${BLUE}📊 Statistics Tests${NC}"
run_json_test "Statistics endpoint" "$BASE_URL/api/consciousness/statistics" "totalQuestions"
echo ""

echo -e "${BLUE}🧠 DPD System Tests${NC}"
run_json_test "DPD empathy score" "$BASE_URL/api/consciousness/dpd" "empathy"
run_json_test "DPD coherence score" "$BASE_URL/api/consciousness/dpd" "coherence"
run_json_test "DPD dissonance score" "$BASE_URL/api/consciousness/dpd" "dissonance"
echo ""

echo -e "${BLUE}📈 Growth Data Tests${NC}"
run_json_test "Growth overview" "$BASE_URL/api/growth/full" "overview"
run_json_test "Personality evolution" "$BASE_URL/api/growth/full" "personalityEvolution"
run_json_test "DPD evolution" "$BASE_URL/api/growth/full" "dpdEvolution"
echo ""

# Test POST endpoints (manual trigger)
echo -e "${BLUE}🎯 Interactive Features Tests${NC}"
echo -n "Testing manual trigger... "
TESTS_TOTAL=$((TESTS_TOTAL + 1))

trigger_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"question":"Test question: What is the nature of testing?"}' \
    "$BASE_URL/api/consciousness/trigger" 2>/dev/null)

trigger_http_code="${trigger_response: -3}"
if [ "$trigger_http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "   📝 Test question sent successfully"
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $trigger_http_code)"
fi

# Test energy recharge
echo -n "Testing energy recharge... "
TESTS_TOTAL=$((TESTS_TOTAL + 1))

recharge_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"amount":5}' \
    "$BASE_URL/api/consciousness/recharge-energy" 2>/dev/null)

recharge_http_code="${recharge_response: -3}"
if [ "$recharge_http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "   ⚡ Energy recharge test completed"
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $recharge_http_code)"
fi
echo ""

# Test real-time updates by checking if values change
echo -e "${BLUE}🔄 Real-time Updates Test${NC}"
echo -n "Checking system clock progression... "
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Get initial system clock
initial_clock=$(curl -s "$BASE_URL/api/consciousness/state" 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('systemClock', 0))" 2>/dev/null)

# Wait 3 seconds
sleep 3

# Get updated system clock
updated_clock=$(curl -s "$BASE_URL/api/consciousness/state" 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('systemClock', 0))" 2>/dev/null)

if [ "$updated_clock" -gt "$initial_clock" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "   📊 System clock: $initial_clock → $updated_clock"
else
    echo -e "${RED}❌ FAIL${NC} (Clock not progressing: $initial_clock → $updated_clock)"
fi
echo ""

# Summary
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "==============="
echo "Total Tests: $TESTS_TOTAL"
echo -e "✅ Passed: ${GREEN}$TESTS_PASSED${NC}"
TESTS_FAILED=$((TESTS_TOTAL - TESTS_PASSED))
echo -e "❌ Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
fi
echo -e "📈 Success Rate: ${GREEN}${SUCCESS_RATE}%${NC}"

echo ""
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎯 All UI tests passed! The Aenea interface is working correctly.${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Check the API endpoints and UI configuration.${NC}"
fi