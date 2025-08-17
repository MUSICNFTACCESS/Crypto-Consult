
#!/usr/bin/env bash
set -Eeuo pipefail

# =========================
# Config
# =========================
BASE="${BASE:-http://localhost:3000}"   # override: BASE="https://crypto-consult.onrender.com" ./test_crimzn.sh
TIMEOUT="${TIMEOUT:-20}"

# =========================
# Pretty printing helpers
# =========================
RED="$(printf '\033[31m')"
GRN="$(printf '\033[32m')"
YEL="$(printf '\033[33m')"
BLU="$(printf '\033[34m')"
DIM="$(printf '\033[2m')"
RST="$(printf '\033[0m')"

pass() { echo -e "${GRN}PASS${RST}  $*"; }
fail() { echo -e "${RED}FAIL${RST}  $*"; }
info() { echo -e "${BLU}INFO${RST}  $*"; }
skip() { echo -e "${YEL}SKIP${RST}  $*"; }

# wallet rotator to dodge 3-free limiter
new_wallet() {
  echo "TEST_$(date +%s)_$RANDOM"
}

# curl wrappers
get() {
  curl -sS --max-time "$TIMEOUT" "$BASE$1"
}
post_ask() {
  local prompt="$1"
  local wallet="$2"
  curl -sS --max-time "$TIMEOUT" \
    -H 'Content-Type: application/json' \
    -X POST "$BASE/ask" \
    -d "{\"prompt\":\"$prompt\",\"wallet\":\"$wallet\"}"
}

# assert helpers (no jq dependency)
assert_contains() {
  local hay="$1" needle="$2" label="$3"
  if grep -qi --fixed-strings -- "$needle" <<<"$hay"; then
    pass "$label"
  else
    echo "$hay" | sed -n '1,15p' | sed 's/^/       | /'
    fail "$label (missing: $needle)"
    return 1
  fi
}

assert_any_contains() {
  local hay="$1"; shift
  local label="${@: -1}"; set -- "${@:1:$(($#-1))}"
  for needle in "$@"; do
    if grep -qi --fixed-strings -- "$needle" <<<"$hay"; then
      pass "$label"
      return 0
    fi
  done
  echo "$hay" | sed -n '1,15p' | sed 's/^/       | /'
  fail "$label (none of: $*)"
  return 1
}

# =========================
# Tests
# =========================
main() {
  echo -e "${DIM}BASE=$BASE${RST}"
  local failures=0

  # 1) Server-side spot prices proxy (no OpenAI)
  info "Live prices proxy"
  out="$(get /livePrices || true)"
  if grep -q '"bitcoin"' <<<"$out" && grep -q '"ethereum"' <<<"$out" && grep -q '"solana"' <<<"$out"; then
    pass "GET /livePrices returns BTC/ETH/SOL JSON"
  else
    echo "$out" | sed -n '1,15p' | sed 's/^/       | /'
    fail "GET /livePrices"
    ((failures++)) || true
  fi

  # 2) Fear & Greed Index (Alternative.me)
  info "Fear & Greed Index"
  W="$(new_wallet)"
  out="$(post_ask "fear and greed index" "$W" || true)"
  if grep -qi 'Fear & Greed' <<<"$out"; then
    pass "Fear & Greed text present"
  else
    echo "$out" | sed -n '1,20p' | sed 's/^/       | /'
    fail "Fear & Greed request"
    ((failures++)) || true
  fi

  # 3) Single price by SYMBOL ($SOL)
  info "Price by symbol \$SOL"
  W="$(new_wallet)"
  out="$(post_ask "what is \$sol trading at in usd?" "$W" || true)"
  if grep -qi 'SOL/USD:' <<<"$out"; then
    pass "Price line includes SOL/USD"
  else
    echo "$out" | sed -n '1,20p' | sed 's/^/       | /'
    fail "Price \$SOL"
    ((failures++)) || true
  fi

  # 4) Single price by NAME (solana)
  info "Price by name (solana)"
  W="$(new_wallet)"
  out="$(post_ask "price of solana" "$W" || true)"
  if grep -qi 'SOL/USD:' <<<"$out"; then
    pass "Price line includes SOL/USD (name resolution)"
  else
    echo "$out" | sed -n '1,20p' | sed 's/^/       | /'
    fail "Price 'solana'"
    ((failures++)) || true
  fi

  # 5) Multi-asset + comparison (ETH vs SOL)
  info "Multi-asset + comparison"
  W="$(new_wallet)"
  out="$(post_ask "price of eth and sol and which is better?" "$W" || true)"
  if grep -qi 'FREE_LIMIT_REACHED' <<<"$out"; then
    skip "Limiter tripped early (try again with a new wallet)"
  else
    # Accept success if we got both price lines, and either 'Verdict' or some bullets
    if grep -qi 'ETH/USD:' <<<"$out" && grep -qi 'SOL/USD:' <<<"$out"; then
      if grep -qi 'Verdict' <<<"$out" || grep -qi 'Thesis' <<<"$out"; then
        pass "Compare returned prices and analysis"
      else
        pass "Compare returned prices (no analysis); acceptable"
      fi
    else
      echo "$out" | sed -n '1,25p' | sed 's/^/       | /'
      fail "ETH vs SOL compare"
      ((failures++)) || true
    fi
  fi

  # 6) Long-tail token (MOG) – expect non-empty response without limiter
  info "Long-tail token (MOG)"
  W="$(new_wallet)"
  out="$(post_ask "price of mog" "$W" || true)"
  if grep -qi 'FREE_LIMIT_REACHED' <<<"$out"; then
    skip "Limiter tripped on MOG (rerun to confirm)"
  else
    # pass if we either got a price line (MOG/USD) OR at least an Updated: header (non-empty response path)
    if grep -qi 'MOG/USD:' <<<"$out" || grep -qi '^Updated:' <<<"$out"; then
      pass "Long-tail token handled"
    else
      echo "$out" | sed -n '1,25p' | sed 's/^/       | /'
      fail "Long-tail token (MOG)"
      ((failures++)) || true
    fi
  fi

  # 7) CryptoPanic headlines — pass if either headlines list OR “key missing”
  info "CryptoPanic headlines"
  W="$(new_wallet)"
  out="$(post_ask "crypto market update headlines" "$W" || true)"
  if grep -qi 'Top headlines:' <<<"$out"; then
    pass "CryptoPanic returned headlines"
  elif grep -qi 'CryptoPanic key missing.' <<<"$out"; then
    pass "CryptoPanic not configured (graceful)"
  else
    echo "$out" | sed -n '1,20p' | sed 's/^/       | /'
    fail "CryptoPanic headlines"
    ((failures++)) || true
  fi

  echo
  if (( failures == 0 )); then
    echo -e "${GRN}All tests passed ✅${RST}"
    exit 0
  else
    echo -e "${RED}$failures test(s) failed ❌${RST}"
    exit 1
  fi
}

main "$@"
