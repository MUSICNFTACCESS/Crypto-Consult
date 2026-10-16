'use strict';

function formatVerifiedMarketContext(context) {
  if (typeof context !== 'string' || !context.trim())
    return '';

  const lines = context.split(/\r?\n/)
    .map(line => line.trim());

  const rows = lines.filter(line =>
    /^(?:Asset:|Market:|Observed 24H range:|(?:1H|4H|1D) completed:)/.test(line)
  );

  // Never display unverified or incomplete market context.
  if (!rows.some(line =>
    /^(?:1H|4H|1D) completed:/.test(line)
  )) return '';

  return [
    '',
    '',
    '• Verified technical indicators:',
    'Source: Coinbase Exchange — completed candles',
    ...rows
  ].join('\n');
}

module.exports = { formatVerifiedMarketContext };
