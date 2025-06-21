const fetch = require('node-fetch');

async function fetchBTCdominance() {
  const res = await fetch('https://api.coingecko.com/api/v3/global');
  const data = await res.json();
  return data.data.market_cap_percentage.btc;
}

function calculateRSI(prices, period = 14) {
  const gains = [];
  const losses = [];

  for (let i = 1; i <= period; i++) {
    const delta = prices[i][1] - prices[i - 1][1];
    if (delta > 0) gains.push(delta);
    else losses.push(Math.abs(delta));
  }

  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

async function fetchRSI() {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
  const data = await res.json();
  return calculateRSI(data.prices.slice(-15)); // 14-period RSI
}

module.exports = { fetchBTCdominance, fetchRSI };
