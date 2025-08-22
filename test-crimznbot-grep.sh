#!/usr/bin/env bash
set -eo pipefail

BASE="${BASE:-http://localhost:3000}"   # override per-run if needed
echo "BASE=$BASE"

W_PRICE="PRICE_$RANDOM"
W_COMPARE="COMPARE_$RANDOM"
W_NEWS="NEWS_$RANDOM"
W_FNG="FNG_$RANDOM"
W_COMPLEX="COMPLEX_$RANDOM"
W_EDGE="EDGE_$RANDOM"

pass(){ echo "PASS $*"; }
fail(){ echo "FAIL $*"; }

### PRICE ###
# BTC tests
curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"what's \\$BTC price right now?\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+BTC/USD:' && pass "price BTC" || fail "price BTC"

curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"how much is bitcoin worth\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+BTC/USD:' && pass "price bitcoin(word)" || fail "price bitcoin(word)"

curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"current price of BTC\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+BTC/USD:' && pass "alias current BTC" || fail "alias current BTC"

# ETH tests
curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"what is \\$ETH trading at\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+ETH/USD:' && pass "price ETH" || fail "price ETH"

curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"show ETH price\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+ETH/USD:' && pass "alias show ETH" || fail "alias show ETH"

# SOL tests
curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"how much is sol worth\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+SOL/USD:' && pass "price SOL" || fail "price SOL"

curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"give me SOL value\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+SOL/USD:' && pass "alias SOL" || fail "alias SOL"

# ONDO tests
curl -s -X POST "$BASE/ask" -H "Content-Type: application/json" \
  -d "{\"prompt\":\"price of ONDO\",\"wallet\":\"$W_PRICE\"}" \
  | grep -Eq '💰[[:space:]]+ONDO/USD:' && pass "price ONDO" || fail "price ONDO"

# --- COMPARE (prices + verdict) ---
curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"compare ETH vs SOL\",\"wallet\":\"$W_COMPARE\"}" \
  | grep -Eq '💰[[:space:]]+(ETH|SOL)/USD:' && pass "compare prices" || fail "compare prices"

curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"compare ETH vs SOL\",\"wallet\":\"$W_COMPARE\"}" \
  | grep -Eq 'Verdict|Winner|Confidence' && pass "compare verdict" || fail "compare verdict"

# --- NEWS ---
curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"news on SOL\",\"wallet\":\"$W_NEWS\"}" \
  | grep -Eq 'Top headlines|headlines|No fresh crypto headlines' && pass "news SOL" || fail "news SOL"

# --- FEAR & GREED ---
curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"show me the Fear & Greed index\",\"wallet\":\"$W_FNG\"}" \
  | grep -Ei 'Fear[[:space:]]*&[[:space:]]*Greed|Greed Index|Index' && pass "fear&greed" || fail "fear&greed"

# --- COMPLEX (no price injection) ---
OUT_COMPLEX="$(curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"Explain ONDO’s use case & 4 key risks in bullets; concise, actionable.\",\"wallet\":\"$W_COMPLEX\"}")"
echo "$OUT_COMPLEX" | grep -q '💰' && fail "complex (price leaked)" || pass "complex (no price)"
echo "$OUT_COMPLEX" | grep -Eq 'Use Case|Risks|^- |•' && pass "complex (content ok)" || fail "complex (content)"

# --- EDGE CASES ---
curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"how much is it worth?\",\"wallet\":\"$W_EDGE\"}" \
  | grep -Ei 'specify|what.*refers to|need.*token' && pass "edge vague clarifier" || fail "edge vague clarifier"

curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"🚀?? lfg??\",\"wallet\":\"$W_EDGE\"}" \
  | grep -Ei 'LFG|market|volatil|resistance|trend' && pass "edge emoji" || fail "edge emoji"

# --- LIMITER (3 free -> 429 with code) ---
WLIM="LIMIT_$RANDOM"
for i in 1 2 3; do
  curl -sS -X POST "$BASE/ask" -H 'Content-Type: application/json' \
    -d "{\"prompt\":\"test $i\",\"wallet\":\"$WLIM\"}" >/dev/null
done
HDR="$(curl -si -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "{\"prompt\":\"trigger limiter\",\"wallet\":\"$WLIM\"}")"
echo "$HDR" | grep -q " 429 " && pass "limiter 429" || fail "limiter 429"
echo "$HDR" | grep -q '"FREE_LIMIT_REACHED"' && pass "limiter code" || fail "limiter code"
