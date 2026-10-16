'use strict';

const { getMarkets } = require('./market-resolver');
const { getMarketAnalysis } = require('./multi-market-context');

const technicalWords =
  /\b(?:analy[sz]e|analysis|technical|charts?|candles?|rsi\d*|ema\d*|moving averages?|support|resistance|trend|momentum|bullish|bearish|divergence|reversal|breakout|breakdown|price action|entry|invalidation|targets?|stop.loss|buy|sell|long|short|trade|trading)\b/i;

const educationalStart =
  /^\s*(?:what is|what are|how does|how do|explain|define|teach me|difference between)\b/i;

const currentAnalysis =
  /\b(?:today|right now|currently|latest|charts?|support|resistance|entry|breakout|breakdown|buy|sell|long|short|analy[sz]e)\b/i;

const commonWords = new Set([
  'AI', 'ONE', 'NEAR', 'LINK', 'IN', 'ON',
  'GO', 'UP', 'US', 'FOR', 'THE', 'NEW',
  'BUY', 'SELL', 'LONG', 'SHORT',
  'ALL', 'ANY', 'NOW', 'TIME', 'USD', 'USDC'
]);

function isTechnicalQuestion(prompt) {
  const text = String(prompt || '');

  if (!technicalWords.test(text)) return false;

  if (educationalStart.test(text) &&
      !currentAnalysis.test(text)) return false;

  return true;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTargets(prompt, markets) {
  const text = String(prompt || '');

  const focus = text.match(
    /\b(?:analy[sz]e|buy|sell|trade|long|short|chart\s+(?:of|for)|support\s+(?:for|on)|resistance\s+(?:for|on))\s+(?:the\s+)?\$?([a-z0-9-]{2,20})\b/i
  )?.[1]?.toUpperCase();

  const matches = [];

  for (const asset of markets) {
    const symbol = asset.symbol;
    const name = asset.name;

    const tickerPattern = new RegExp(
      '\\b' + escapeRegex(symbol) + '\\b', 'gi'
    );

    const dollarPattern = new RegExp(
      '\\$' + escapeRegex(symbol) + '\\b', 'i'
    );

    const words = [...text.matchAll(tickerPattern)];

    const tickerMatch = words.find(m =>
      m[0] === m[0].toUpperCase() ||
      (!commonWords.has(symbol) && symbol.length >= 3) ||
      focus === symbol
    );

    const namePattern = new RegExp(
      '\\b' + escapeRegex(name) + '\\b', 'i'
    );

    const nameMatch =
      name.length >= 4 ? namePattern.exec(text) : null;

    if (tickerMatch || dollarPattern.test(text) || nameMatch) {
      const position = Math.min(
        tickerMatch?.index ?? Infinity,
        nameMatch?.index ?? Infinity,
        dollarPattern.test(text)
          ? Math.max(0, text.toUpperCase().indexOf('$' + symbol))
          : Infinity
      );

      matches.push({ symbol, position });
    }
  }

  return matches
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map(m => m.symbol);
}

async function getTechnicalContext(prompt) {
  if (!isTechnicalQuestion(prompt)) return null;

  const markets = await getMarkets();
  const symbols = findTargets(prompt, markets);

  if (!symbols.length) return null;

  const results = await Promise.all(
    symbols.map(symbol => getMarketAnalysis(symbol))
  );

  return [
    'VERIFIED TECHNICAL MARKET CONTEXT',
    ...results.map((r, i) =>
      r.status === 'found'
        ? r.context
        : `${symbols[i]}: Verified candles unavailable (${r.status}). Do not invent levels.`
    ),
    'Use the requested asset, not BTC by default.',
    'Distinguish observed ranges from confirmed support and resistance.',
    'Use verified timeframe data for directional conclusions.',
    'Never invent missing technical indicators or trade levels.'
  ].join('\n\n');
}

module.exports = {
  isTechnicalQuestion,
  findTargets,
  getTechnicalContext
};
