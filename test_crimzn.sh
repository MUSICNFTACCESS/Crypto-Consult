#!/usr/bin/env bash
# Set this to your Render URL (recommended), or leave as localhost for local runs.
BASE="${BASE:-https://YOUR-RENDER-APP.onrender.com}"

WALLET="So11111111111111111111111111111111111111112"

echo "==> BASE: $BASE"
echo

run() {
  local label="$1"; shift
  echo "— $label"
  curl -s -X POST "$BASE/ask" \
    -H "Content-Type: application/json" \
    -d "$1"
  echo -e "\n"
}

# 1) Fear & Greed Index
run "Fear & Greed Index" \
'{"prompt":"What is the Fear & Greed Index right now?","wallet":"'"$WALLET"'"}'

# 2) Single price by name (lowercase)
run "Price by name (solana)" \
'{"prompt":"what is the price of solana","wallet":"'"$WALLET"'"}'

# 3) Multiple prices + compare intent (symbols)
run "Compare ETH vs SOL (which is better?)" \
'{"prompt":"price eth and sol and which is better","wallet":"'"$WALLET"'"}'

# 4) Dollar-ticker detection
run "Dollar tickers ($ONDO $SOL)" \
'{"prompt":"what are $ondo and $sol trading at in usd?","wallet":"'"$WALLET"'"}'

# 5) Headlines general
run "Crypto news (general)" \
'{"prompt":"give me crypto headlines","wallet":"'"$WALLET"'"}'

# 6) Headlines for a token by name
run "Headlines for Solana" \
'{"prompt":"latest news on solana","wallet":"'"$WALLET"'"}'
