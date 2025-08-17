#!/usr/bin/env bash
set -Eeuo pipefail

# =========================
# Config
# =========================
BASE="${BASE:-http://localhost:3000}"   # override: BASE="https://crypto-consult.onrender.com" ./test_crimzn_full.sh
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

new_wallet(){ echo "TEST_$(date +%s)_$RANDOM"; }

get(){ curl -sS --max-time "$TIMEOUT" "$BASE$1"; }
post_json(){ curl -sS --max-time "$TIMEOUT" -H 'Content-Type: application/json' -X POST "$BASE$1" -d "$2"; }
ask(){ local p="$1" w="$2"; post_json /ask "{\"prompt\":\"$p\",\"wallet\":\"$w\"}"; }

assert_contains(){
  local hay="$1" needle="$2" label="$3"
  if grep -qi --fixed-strings -- "$needle" <<<"$hay"; then pass "$label"; else
    echo "$hay" | sed -n '1,25p' | sed 's/^/       | /'; fail "$label (missing: $needle)"; return 1; fi
}
assert_any(){
  local hay="$1"; shift; local label="${@: -1}"; set -- "${@:1:$(($#-1))}"
  for needle in "$@"; do if grep -qi --fixed-strings -- "$needle" <<<"$hay"; then pass "$label"; return 0; fi; done
  echo "$hay" | sed -n '1,25p' | sed 's/^/       | /'; fail "$label (need one of: $*)"; return 1
}

main(){
  echo -e "${DIM}BASE=$BASE${RST}"
  local fails=0

  # 0) Root responds
  info "GET / (root serves index)"
  out="$(get / || true)"
  if [[ -n "$out" ]]; then pass "Root returned HTML"; else fail "Root did not return content"; ((fails++))||true; fi

  # 1) /livePrices (twice)
  info "GET /livePrices (cache + JSON shape)"
  out1="$(get /livePrices || true)"
  if grep -q '"bitcoin"'<<<"$out1" && grep -q '"ethereum"'<<<"$out1" && grep -q '"solana"'<<<"$out1"; then
    pass "BTC/ETH/SOL present"
  else echo "$out1"|sed -n '1,15p'|sed 's/^/       | /'; fail "livePrices JSON"; ((fails++))||true; fi
  sleep 1
  out2="$(get /livePrices || true)"
  if [[ -n "$out2" ]]; then pass "Second call OK (cache path)"; else fail "Second livePrices call"; ((fails++))||true; fi

  # 2) Fear & Greed
  info "Fear & Greed index"
  W="$(new_wallet)"; out="$(ask 'fear and greed index' "$W" || true)"
  assert_contains "$out" "Fear & Greed" "Fear & Greed response" || ((fails++))||true

  # 3) Price by $SYMBOL
  info "Price by symbol \$SOL"
  W="$(new_wallet)"; out="$(ask 'what is $sol trading at in usd?' "$W" || true)"
  assert_contains "$out" "SOL/USD:" "SOL price line" || ((fails++))||true

  # 4) Price by name (aliases/typos)
  info "Price by name (alias/typo: sonala)"
  W="$(new_wallet)"; out="$(ask 'price of sonala' "$W" || true)"
  assert_contains "$out" "SOL/USD:" "Alias resolves to SOL" || ((fails++))||true

  # 5) Multi-asset compare
  info "ETH vs SOL compare (prices + bullets or verdict)"
  W="$(new_wallet)"; out="$(ask 'price of eth and sol and which is better?' "$W" || true)"
  if grep -qi 'FREE_LIMIT_REACHED'<<<"$out"; then skip "Limiter hit early (rerun)"; else
    if grep -qi 'ETH/USD:'<<<"$out" && grep -qi 'SOL/USD:'<<<"$out"; then
      assert_any "$out" "Verdict" "Thesis" "Compare returned analysis" || ((fails++))||true
    else echo "$out"|sed -n '1,25p'|sed 's/^/       | /'; fail "Compare missing prices"; ((fails++))||true; fi
  fi

  # 6) Long-tail token (CoinGecko search fallback)
  info "Long-tail token (MOG)"
  W="$(new_wallet)"; out="$(ask 'price of mog' "$W" || true)"
  if grep -qi 'FREE_LIMIT_REACHED'<<<"$out"; then skip "Limiter tripped on MOG"; else
    assert_any "$out" "MOG/USD:" "Updated:" "Handled long-tail token" || ((fails++))||true
  fi

  # 7) CryptoPanic headlines (general)
  info "CryptoPanic headlines (general)"
  W="$(new_wallet)"; out="$(ask 'crypto market update headlines' "$W" || true)"
  assert_any "$out" "Top headlines:" "CryptoPanic key missing." "Headlines path works" || ((fails++))||true

  # 8) Token-specific headlines ($ETH) — ensures wantsNews covers 'news on'
  info "CryptoPanic headlines for \$ETH"
  W="$(new_wallet)"; out="$(ask 'news on $ETH' "$W" || true)"
  if grep -qi 'FREE_LIMIT_REACHED'<<<"$out"; then skip "Limiter tripped on news"; else
    assert_any "$out" "Top headlines:" "CryptoPanic key missing." "Headlines-by-symbol path works" || ((fails++))||true
  fi

  # 9) Sentiment analyzer (/pulse): GPT or local fallback
  info "Pulse sentiment"
  out="$(post_json /pulse '{"text":"$SOL looks strong into CPI; dip likely gets bought."}' || true)"
  assert_any "$out" '"Bullish"' '"Bearish"' '"Neutral"' "Pulse returns a stance" || ((fails++))||true

  # 10) Save profile: when Firebase OFF local should return 501
  info "Save profile (Firebase OFF should 501)"
  if curl -sS -o /dev/null -w "%{http_code}" -H 'Content-Type: application/json' \
      -X POST "$BASE/save-profile" -d '{"wallet":"WAL_TEST","name":"A","email":"a@b.c"}' | grep -q '^501$'; then
    pass "save-profile gracefully disabled"
  else
    skip "save-profile not 501 (Firebase may be ON in this env)"
  fi

  # 11) Limiter: 4th ask → FREE_LIMIT_REACHED
  info "Limiter behavior (3 free per wallet)"
  W="LIMITER_$$"
  for i in 1 2 3; do ask "price of bitcoin" "$W" >/dev/null || true; done
  out="$(ask 'price of bitcoin' "$W" || true)"
  assert_contains "$out" "FREE_LIMIT_REACHED" "4th call is blocked" || ((fails++))||true

  # 12) Verify endpoints (shape check)
  info "/verify-paid shape"
  out="$(get "/verify-paid?wallet=$(new_wallet)" || true)"
  assert_any "$out" '"hasPaid":true' '"hasPaid":false' "verify-paid returns hasPaid" || ((fails++))||true

  info "/verify-unlock shape"
  out="$(get "/verify-unlock?sender=$(new_wallet)" || true)"
  assert_any "$out" '"confirmed":true' '"confirmed":false' "verify-unlock returns confirmed" || ((fails++))||true

  echo
  if ((fails==0)); then echo -e "${GRN}All tests passed ✅${RST}"; exit 0
  else echo -e "${RED}$fails test(s) failed ❌${RST}"; exit 1; fi
}

main "$@"
