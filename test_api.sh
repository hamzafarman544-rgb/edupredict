#!/usr/bin/env bash
# ============================================================
# EduPredict — API Integration Test Script
# Run this after starting all three services.
# Prerequisites: curl, jq
# ============================================================

BASE="http://localhost:4000/api"
ML="http://localhost:5001"
TOKEN=""
STUDENT_ID=""

echo ""
echo "==========================================="
echo "  EduPredict — API Integration Tests"
echo "==========================================="

# ── 1. Health checks ────────────────────────────────────────
echo ""
echo "── Health Checks ──────────────────────────"

echo "[Backend]"
curl -s "$BASE/health" | python3 -m json.tool 2>/dev/null || echo "FAILED — is backend running?"

echo ""
echo "[ML Service]"
curl -s "$ML/health" | python3 -m json.tool 2>/dev/null || echo "FAILED — is Flask service running?"

# ── 2. Register ─────────────────────────────────────────────
echo ""
echo "── Auth: Register ─────────────────────────"
REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Instructor","email":"test@university.edu","password":"test123456"}')
echo "$REGISTER" | python3 -m json.tool 2>/dev/null || echo "$REGISTER"

# ── 3. Login ────────────────────────────────────────────────
echo ""
echo "── Auth: Login ────────────────────────────"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@university.edu","password":"test123456"}')
echo "$LOGIN" | python3 -m json.tool 2>/dev/null || echo "$LOGIN"

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not extract JWT token. Aborting."
  exit 1
fi
echo "JWT Token obtained: ${TOKEN:0:40}..."

# ── 4. Get current user ─────────────────────────────────────
echo ""
echo "── Auth: Get Current User (/me) ───────────"
curl -s "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null

# ── 5. Forgot Password ──────────────────────────────────────
echo ""
echo "── Auth: Forgot Password ──────────────────"
curl -s -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@university.edu"}' | python3 -m json.tool 2>/dev/null
echo "(Check backend console for the reset URL)"

# ── 6. Create student ───────────────────────────────────────
echo ""
echo "── Students: Create ───────────────────────"
STUDENT=$(curl -s -X POST "$BASE/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":      "Aisha Malik",
    "studentId": "STU-2024-001",
    "email":     "aisha.malik@uni.edu",
    "course":    "Computer Science",
    "semester":  "Spring 2025"
  }')
echo "$STUDENT" | python3 -m json.tool 2>/dev/null || echo "$STUDENT"
STUDENT_ID=$(echo "$STUDENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('student',{}).get('_id',''))" 2>/dev/null)
echo "Student ID: $STUDENT_ID"

# ── 7. List students ────────────────────────────────────────
echo ""
echo "── Students: List ─────────────────────────"
curl -s "$BASE/students" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null

# ── 8. Direct ML service test ────────────────────────────────
echo ""
echo "── ML Service: Direct Prediction ─────────"
curl -s -X POST "$ML/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance":       85.0,
    "grade_avg":        78.5,
    "assignments":      82.0,
    "engagement":       70.0,
    "prev_gpa":         3.2,
    "study_hours":      5.0,
    "participation":    7,
    "missed_deadlines": 1
  }' | python3 -m json.tool 2>/dev/null

# ── 9. Full prediction via backend ──────────────────────────
echo ""
echo "── Predictions: Full Flow (Frontend→Node.js→Flask→MongoDB) ──"
if [ -n "$STUDENT_ID" ]; then
  PREDICTION=$(curl -s -X POST "$BASE/predictions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"student_id\":       \"$STUDENT_ID\",
      \"attendance\":       85.0,
      \"grade_avg\":        78.5,
      \"assignments\":      82.0,
      \"engagement\":       70.0,
      \"prev_gpa\":         3.2,
      \"study_hours\":      5.0,
      \"participation\":    7,
      \"missed_deadlines\": 1,
      \"notes\":            \"Consistent performer, slight dip this week\"
    }")
  echo "$PREDICTION" | python3 -m json.tool 2>/dev/null || echo "$PREDICTION"
else
  echo "SKIPPED — student ID not available"
fi

# ── 10. At-Risk prediction ──────────────────────────────────
echo ""
echo "── Predictions: At-Risk Student Example ───"
AT_RISK_STUDENT=$(curl -s -X POST "$BASE/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tom Struggling","studentId":"STU-2024-002","course":"Engineering"}')
RISK_ID=$(echo "$AT_RISK_STUDENT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('student',{}).get('_id',''))" 2>/dev/null)

if [ -n "$RISK_ID" ]; then
  curl -s -X POST "$BASE/predictions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"student_id\":       \"$RISK_ID\",
      \"attendance\":       45.0,
      \"grade_avg\":        42.0,
      \"assignments\":      38.0,
      \"engagement\":       30.0,
      \"prev_gpa\":         1.5,
      \"study_hours\":      1.5,
      \"participation\":    2,
      \"missed_deadlines\": 6
    }" | python3 -m json.tool 2>/dev/null
fi

# ── 11. List predictions ────────────────────────────────────
echo ""
echo "── Predictions: List All ──────────────────"
curl -s "$BASE/predictions?limit=10" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null

# ── 12. Stats ───────────────────────────────────────────────
echo ""
echo "── Predictions: Stats ─────────────────────"
curl -s "$BASE/predictions/stats" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null

# ── 13. ML Model info ───────────────────────────────────────
echo ""
echo "── ML Service: Model Info ─────────────────"
curl -s "$ML/model/info" | python3 -m json.tool 2>/dev/null

# ── 14. Batch prediction ────────────────────────────────────
echo ""
echo "── ML Service: Batch Prediction ───────────"
curl -s -X POST "$ML/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {"student_id":"A1","attendance":90,"grade_avg":88,"assignments":92,"engagement":80,"prev_gpa":3.8,"study_hours":6,"participation":9,"missed_deadlines":0},
      {"student_id":"A2","attendance":55,"grade_avg":50,"assignments":48,"engagement":40,"prev_gpa":1.8,"study_hours":2,"participation":3,"missed_deadlines":5}
    ]
  }' | python3 -m json.tool 2>/dev/null

echo ""
echo "==========================================="
echo "  All tests completed."
echo "==========================================="
