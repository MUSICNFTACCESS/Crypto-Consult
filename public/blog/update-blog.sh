cat <<HTML > "$BLOG_FILE"
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
    .chart-container {
      margin-top: 30px;
    }
    .price {
      font-size: 1.5em;
      margin-bottom: 10px;
    }
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
  <p class="price">Current BTC Price: \$${BTC_PRICE}</p>

  <div class="summary">
    <strong>CrimznBot Summary:</strong>
    <p>🧠 AI commentary will appear here soon. (e.g. "BTC is showing strength after ETF inflows...")</p>
  </div>

  <div class="chart-container">
    <h3>Live BTC Chart:</h3>
    <div class="tradingview-widget-container">
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
