'use strict';

const BASE = 'https://api.exchange.coinbase.com';
let cached = null;
let cachedAt = 0;

async function getJSON(path) {
  const res = await fetch(BASE + path, {
    headers: {
      'User-Agent': 'CryptoConsult/1.0',
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!res.ok) {
    throw new Error(`Coinbase HTTP ${res.status}`);
  }

  return res.json();
}

async function getMarkets() {
  if (cached && Date.now() - cachedAt < 1800000) {
    return cached;
  }

  const products = await getJSON('/products');

  if (!Array.isArray(products)) {
    throw new Error('Invalid Coinbase market list');
  }

  let currencies = [];

  try {
    currencies = await getJSON('/currencies');
  } catch (e) {
    console.warn('Currency names unavailable:', e.message);
  }

  const names = new Map();

  if (Array.isArray(currencies)) {
    for (const c of currencies) {
      if (c.id && c.name) {
        names.set(c.id.toUpperCase(), c.name);
      }
    }
  }

  const assets = new Map();

  for (const p of products) {
    const symbol = String(p.base_currency || '')
      .toUpperCase();

    const quote = String(p.quote_currency || '')
      .toUpperCase();

    if (
      !symbol ||
      !['USD', 'USDC'].includes(quote) ||
      p.status !== 'online' ||
      p.trading_disabled === true
    ) continue;

    const entry = {
      symbol,
      name: names.get(symbol) || p.base_name || symbol,
      pair: p.id,
      exchange: 'Coinbase Exchange'
    };

    const previous = assets.get(symbol);

    if (!previous || quote === 'USD') {
      assets.set(symbol, entry);
    }
  }

  cached = [...assets.values()];
  cachedAt = Date.now();

  return cached;
}

async function findMarket(query) {
  const input = String(query || '').trim();

  if (!/^[a-z0-9 ._-]{1,80}$/i.test(input)) {
    return { status: 'invalid' };
  }

  const assets = await getMarkets();
  const wanted = input.toLowerCase();

  // Prefer an exact ticker match.
  const symbols = assets.filter(
    a => a.symbol.toLowerCase() === wanted
  );

  if (symbols.length === 1) {
    return { status: 'found', ...symbols[0] };
  }

  // Otherwise require an exact asset-name match.
  const names = assets.filter(
    a => a.name.toLowerCase() === wanted
  );

  if (names.length === 1) {
    return { status: 'found', ...names[0] };
  }

  if (names.length > 1) {
    return {
      status: 'ambiguous',
      candidates: names
    };
  }

  return {
    status: 'not_listed',
    query: input
  };
}

module.exports = { getMarkets, findMarket };
