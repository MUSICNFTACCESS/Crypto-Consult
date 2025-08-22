#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-25}"
LINES="${LINES:-160}"

banner(){ printf "\n\033[1;36m== %s ==\033[0m\n" "$*"; }
ask () {
  local WALLET="$1"; shift
  local PROMPT="$*"
  local BODY
  BODY="$(jq -n --arg prompt "$PROMPT" --arg wallet "$WALLET" '{prompt:$prompt, wallet:$wallet}')"
  curl -sS -m "$TIMEOUT" -X POST "$BASE/ask" \
    -H 'Content-Type: application/json' \
    -d "$BODY" | sed -n "1,${LINES}p"
}

W_PRICE="PRICE_$RANDOM"; W_PRICE_NAME="PRICE_NAME_$RANDOM"
W_COMPARE="COMPARE_$RANDOM"; W_NEWS="NEWS_$RANDOM"
W_FNG="FNG_$RANDOM"; W_COMPLEX="COMPLEX_$RANDOM"; W_EDGE="EDGE_$RANDOM"

banner "ENV"; echo "BASE=$BASE"; echo "TIMEOUT=$TIMEOUT  LINES=$LINES"

banner "PRICE: simple symbol"
ask "$W_PRICE" 'price of SOL'

banner "PRICE: symbol with $ prefix"
ask "$W_PRICE" 'what'"'"'s $BTC price right now?'

banner "PRICE: lowercase name (tests cgSearch fallback)"
ask "$W_PRICE_NAME" 'what'"'"'s the price of ondo'

banner "PRICE: fuzzy naming (misspelling hint)"
ask "$W_PRICE_NAME" 'price of ethreum'

banner "COMPARE: classic"
ask "$W_COMPARE" 'compare ETH vs SOL'

banner "COMPARE: reversed order + symbols"
ask "$W_COMPARE" 'Compare $SOL and $ETH — speed, fees, decentralization, adoption; verdict pls'

banner "COMPARE: L2s"
ask "$W_COMPARE" 'compare ARB vs OP'

banner "NEWS: token-specific"
ask "$W_NEWS" 'news on SOL'

banner "NEWS: generic market update"
ask "$W_NEWS" 'market update headlines'

banner "FEAR & GREED: keyword variations"
ask "$W_FNG" 'show me the Fear & Greed index'
ask "$W_FNG" 'what'"'"'s the greed index today'

banner "COMPLEX: use case + risks"
ask "$W_COMPLEX" 'Explain ONDO’s use case & 4 key risks in bullets; concise, actionable.'

banner "COMPLEX: tokenomics & supply schedule"
ask "$W_COMPLEX" 'Tokenomics for SOL: supply dynamics, issuance, unlock patterns, and how that affects price over the next 12 months.'

banner "COMPLEX: catalysts checklist"
ask "$W_COMPLEX" 'Top 5 near-term catalysts to watch for ETH and how to monitor them quickly.'

banner "COMPLEX: portfolio sizing framework"
ask "$W_COMPLEX" 'I’m risk-aware. Give me a simple framework to size positions across BTC/ETH/SOL with DCA and max drawdown guardrails.'

banner "COMPLEX: regime/market structure"
ask "$W_COMPLEX" 'What signals tell me we’re shifting from distribution to accumulation in crypto? Give a quick playbook.'

banner "COMPLEX: on-chain activity"
ask "$W_COMPLEX" 'How to quickly gauge real adoption on Solana using on-chain metrics? (list tools/metrics, no fluff).'

banner "COMPLEX: staking yield vs risk"
ask "$W_COMPLEX" 'Pros/cons of staking SOL vs holding liquid for opportunities; what should I check before staking?'

banner "COMPLEX: gas/fees strategy"
ask "$W_COMPLEX" 'Gas fee strategy during volatility spikes on Ethereum—how to transact safely and cheaply?'

banner "COMPLEX: risk checklist (small-cap)"
ask "$W_COMPLEX" 'Give me a pre-buy risk checklist for small-cap tokens; terse, high-signal.'

banner "COMPLEX: security hygiene"
ask "$W_COMPLEX" 'Wallet hygiene: list the 8 most important habits to avoid getting drained.'

banner "EDGE: empty-ish prompt"
ask "$W_EDGE" '   '

banner "EDGE: emoji/noise"
ask "$W_EDGE" '🚀?? lfg??'

banner "EDGE: mixed case + non-token word"
ask "$W_EDGE" 'Price of Apple?'

banner "EDGE: multi-language"
ask "$W_EDGE" '¿Cuál es el caso de uso de SOL y sus riesgos principales? Responde en viñetas.'

banner "LIMITER: consume 3, 4th should 429 with JSON body"
WLIM="LIMIT_$RANDOM"
for i in 1 2 3; do ask "$WLIM" 'test case' >/dev/null; done
curl -si -X POST "$BASE/ask" -H 'Content-Type: application/json' \
  -d "$(jq -n --arg prompt 'trigger limiter' --arg wallet "$WLIM" '{prompt:$prompt, wallet:$wallet}')" \
  | sed -n '1,40p'

banner "DONE"
