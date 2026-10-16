'use strict';

const { findMarket } = require('./market-resolver');

const API = 'https://api.exchange.coinbase.com';

async function candles(pair, seconds) {
  const url = `${API}/products/${encodeURIComponent(pair)}/candles?granularity=${seconds}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CryptoConsult/1.0',
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok)
    throw Error(`Coinbase HTTP ${res.status}`);

  const data = await res.json();

  if (!Array.isArray(data))
    throw Error('Invalid candle data');

  const now = Math.floor(Date.now() / 1000);

  return data
    .filter(c =>
      Array.isArray(c) &&
      c.length >= 6 &&
      c.slice(0, 6).every(n =>
        Number.isFinite(Number(n))) &&
      Number(c[1]) > 0 &&
      Number(c[4]) > 0 &&
      Number(c[5]) >= 0 &&
      Number(c[0]) + seconds <= now
    )
    .map(c => c.slice(0, 6).map(Number))
    .sort((a, b) => a[0] - b[0]);
}

function aggregate4H(hourly) {
  const groups = new Map();

  for (const c of hourly) {
    const start = Math.floor(c[0] / 14400) * 14400;

    if (!groups.has(start))
      groups.set(start, []);

    groups.get(start).push(c);
  }

  const result = [];

  for (const [start, rows] of groups) {
    if (
      rows.length !== 4 ||
      !rows.every((c, i) => c[0] === start + i * 3600)
    ) continue;

    result.push([
      start,
      Math.min(...rows.map(c => c[1])),
      Math.max(...rows.map(c => c[2])),
      rows[0][3],
      rows[3][4],
      rows.reduce((sum, c) => sum + c[5], 0)
    ]);
  }

  return result.sort((a, b) => a[0] - b[0]);
}

function ema(values, period) {
  let result = values.slice(0, period)
    .reduce((a, b) => a + b, 0) / period;

  const k = 2 / (period + 1);

  for (let i = period; i < values.length; i++)
    result = values[i] * k + result * (1 - k);

  return result;
}

function rsi(values, period = 14) {
  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }

  gain /= period;
  loss /= period;

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];

    gain = (gain * (period - 1) +
      Math.max(change, 0)) / period;

    loss = (loss * (period - 1) +
      Math.max(-change, 0)) / period;
  }

  if (loss === 0)
    return gain === 0 ? 50 : 100;

  return 100 - 100 / (1 + gain / loss);
}

function price(n) {
  const digits =
    n >= 100 ? 2 :
    n >= 1 ? 4 :
    n >= 0.01 ? 6 :
    n >= 0.0001 ? 8 :
    n >= 0.00000001 ? 12 : 16;

  return '$' + n.toLocaleString('en-US', {
    maximumFractionDigits: digits
  });
}

function summary(label, periodSeconds, rows) {
  if (rows.length < 55)
    throw Error(`Insufficient ${label} history`);

  const last = rows.at(-1);
  const age = Date.now() / 1000 -
    (last[0] + periodSeconds);

  if (age > periodSeconds * 2 + 120)
    throw Error(`Stale ${label} data`);

  const closes = rows.map(c => c[4]);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const close = last[4];

  const avgVolume = rows.slice(-21, -1)
    .reduce((s, c) => s + c[5], 0) / 20;

  const relativeVolume = avgVolume > 0
    ? (last[5] / avgVolume).toFixed(2) + 'x'
    : 'unavailable';

  const trend =
    close > e20 && e20 > e50 ? 'Bullish EMA alignment' :
    close < e20 && e20 < e50 ? 'Bearish EMA alignment' :
    'Mixed EMA alignment';

  return [
    `${label} completed: ${new Date(
      (last[0] + periodSeconds) * 1000
    ).toISOString()}`,
    `Close ${price(close)}`,
    `EMA20 ${price(e20)}`,
    `EMA50 ${price(e50)}`,
    `RSI14 ${rsi(closes).toFixed(1)}`,
    `Relative volume ${relativeVolume}`,
    trend
  ].join(' | ');
}

async function getMarketAnalysis(query) {
  const market = await findMarket(query);

  if (market.status !== 'found')
    return {
      status: market.status,
      query
    };

  try {
    const [hourly, daily] = await Promise.all([
      candles(market.pair, 3600),
      candles(market.pair, 86400)
    ]);

    const fourHour = aggregate4H(hourly);
    const last24 = hourly.slice(-24);

    if (
      last24.length !== 24 ||
      !last24.every((c, i) =>
        i === 0 ||
        c[0] === last24[i - 1][0] + 3600)
    ) {
      throw Error('Incomplete 24H range');
    }

    const low = Math.min(...last24.map(c => c[1]));
    const high = Math.max(...last24.map(c => c[2]));

    const context = [
      `Asset: ${market.name} (${market.symbol})`,
      `Market: ${market.pair}`,
      `Exchange: ${market.exchange}`,
      `Observed 24H range: ${price(low)} to ${price(high)}`,
      summary('1H', 3600, hourly),
      summary('4H', 14400, fourHour),
      summary('1D', 86400, daily),
      'Completed candles only.',
      'Range boundaries are not confirmed support/resistance.',
      'Do not invent order flow, funding, VWAP, or chart patterns.'
    ].join('\n');

    return {
      status: 'found',
      symbol: market.symbol,
      pair: market.pair,
      context
    };

  } catch (e) {
    return {
      status: 'data_unavailable',
      symbol: market.symbol,
      pair: market.pair,
      reason: e.message
    };
  }
}

module.exports = { getMarketAnalysis };
