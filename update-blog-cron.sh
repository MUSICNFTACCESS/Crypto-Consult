#!/bin/bash

# 1. Setup
TODAY=$(TZ=UTC date +%Y-%m-%d)
BLOG_DIR="$HOME/CryptoConsult/public/blog"
BLOG_FILE="${BLOG_DIR}/${TODAY}.html"
INDEX_FILE="${BLOG_DIR}/blog.html"

# 2. Get live BTC price
BTC_PRICE=$(curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd" | jq -r '.bitcoin.usd')

# 3. Backup existing file if exists
mkdir -p "$BLOG_DIR/archive"
cp "$BLOG_FILE" "$BLOG_DIR/archive/${TODAY}.html.bak" 2>/dev/null

# 4. Generate blog post with chart
cat > "$BLOG_FILE" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BTC Daily Blog - $TODAY</title>
  <style>
    body {
      background-color: #111;
      color: #f7931a;
      font-family: 'Courier New', monospace;
      padding: 20px;
    }
    .price { font-size: 1.5em; margin-bottom: 10px; }
    .summary {
      margin-top: 20px;
      background: #222;
      padding: 10px;
      border-left: 4px solid #f7931a;
    }
  </style>
</head>
<body>
  <h1>BTC Daily Blog</h1>
  <h2>$TODAY</h2>
  <p class="price">Current BTC Price: \$$BTC_PRICE</p>
  <div class="summary">
    <strong>CrimznBot Summary:</strong>
    <p>BTC is holding around \$$BTC_PRICE. Watch ETF flows, dominance, and volume. Momentum intact unless breakdown confirms.</p>
  </div>
  <div class="chart-container" style="margin-top:30px;">
    <h3>Live BTC Chart:</h3>
    <div class="tradingview-widget-container">
      <div id="tradingview-widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
        new TradingView.widget({
          "width": "100%",
          "height": 400,
          "symbol": "BITSTAMP:BTCUSD",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "container_id": "tradingview-widget"
        });
      </script>
    </div>
  </div>
</body>
</html>
HTML

# 5. Update blog index
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CryptoConsult Daily Blog</title><style>body{background:#000;color:#f7931a;font-family:Courier New;padding:20px;}a{color:#f7931a;text-decoration:none;}</style></head><body><h1>CryptoConsult Daily Blog</h1>' > "$INDEX_FILE"
for f in $(ls -r "$BLOG_DIR"/2025-*.html); do
  date=$(basename "$f" .html)
  echo "🔸 <a href=\"$date.html\">$date</a><br>" >> "$INDEX_FILE"
done
echo '</body></html>' >> "$INDEX_FILE"

# 6. Create tweet thread with live price
cat > "$HOME/CryptoConsult/post-thread.py" <<PY
import os
import tweepy
from datetime import datetime

auth = tweepy.OAuth1UserHandler(
    os.environ["API_KEY"],
    os.environ["API_SECRET"],
    os.environ["ACCESS_TOKEN"],
    os.environ["ACCESS_SECRET"]
)
api = tweepy.API(auth)

today = datetime.utcnow().strftime('%Y-%m-%d')
price = "$BTC_PRICE"
url = f"https://crypto-consult.onrender.com/blog/{today}.html"

tweets = [
    f"📰 BTC Daily Blog for {today} 🧵",
    f"📈 BTC Price: \${price}",
    "📊 ETF inflows still strong. Dominance holding. Here’s the full blog:",
    f"🔗 {url}"
]

previous = api.update_status(tweets[0])
for tweet in tweets[1:]:
    previous = api.update_status(
        tweet,
        in_reply_to_status_id=previous.id,
        auto_populate_reply_metadata=True
    )
print("✅ Thread posted.")
PY

# 7. Git commit & push
cd "$HOME/CryptoConsult"
touch force-redeploy.txt
