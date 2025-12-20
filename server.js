// ─────────────────────────────────────────────────────────────────────────────
// Crimzn Consult Backend
// ─────────────────────────────────────────────────────────────────────────────
console.log("🚀 Crimzn Consult Backend v=crimznAug27v1", new Date().toString());
require("dotenv").config();

const express   = require("express");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const fetch     = require("node-fetch");
const cors      = require("cors");
const path      = require("path");
const crypto    = require("crypto");
const nacl      = require("tweetnacl");
const bs58      = require("bs58");
const { PublicKey } = require("@solana/web3.js");

// 📰 CryptoPanic key (optional)
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY;

// 🔐 Firebase Admin Setup
const admin = require("firebase-admin");

// 🔍 ENV Debug
console.log("🧪 Starting ENV Debug Mode...");
console.log("🔐 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? "FOUND" : "❌ MISSING");
console.log("🔑 HELIUS_API_KEY:", process.env.HELIUS_API_KEY ? "FOUND" : "❌ MISSING");
console.log("💼 SOLANA_ADDRESS:", process.env.SOLANA_ADDRESS ? "FOUND" : "❌ MISSING");
console.log("🧠 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "FOUND" : "❌ MISSING");
console.log("📰 CRYPTOPANIC_API_KEY:", CRYPTOPANIC_API_KEY ? "FOUND" : "❌ MISSING");

let db = null;
try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || "";
  const decodedKey = raw ? Buffer.from(raw, "base64").toString("utf-8") : "";
  const serviceAccount = decodedKey ? JSON.parse(decodedKey) : null;

  if (serviceAccount && typeof serviceAccount === "object" && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log("✅ Firebase Admin initialized");
  } else if (!serviceAccount) {
    console.warn("⚠️ Firebase service account not provided or invalid — skipping init (OK for local dev).");
  }
} catch (e) {
  console.error("❌ Firebase Admin init skipped (parse/init error):", e.message);
  db = null;
}

// ⚙️ App Init
const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

// ===== Load top 100 tokens =====
let topTokens = {};      // { SYMBOL_UPPER: cgId, NAME_UPPER: cgId }
let cgIdToSymbol = {};   // { cgId: SYMBOL_UPPER }

const loadTopTokens = async () => {
  const attempt = async (n) => {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    );
    if (!r.ok) throw new Error(`CG top tokens HTTP ${r.status}`);
    return r.json();
  };

  try {
    let data;
    for (let i = 0; i < 3; i++) {
      try { data = await attempt(i); break; }
      catch (e) {
        const wait = (i + 1) * 1000;
        console.warn(`▲ loadTopTokens attempt ${i + 1} failed: ${e.message} — retrying in ${wait}ms`);
        await new Promise(res => setTimeout(res, wait));
      }
    }
    if (!data) throw new Error("CG markets fetch failed after retries");

    topTokens = {};
    cgIdToSymbol = {};
    data.forEach((coin) => {
      const symU  = (coin.symbol || "").toUpperCase();
      const nameU = (coin.name   || "").toUpperCase();
      if (symU)  topTokens[symU]  = coin.id;
      if (nameU) topTokens[nameU] = coin.id;
      if (coin.id && symU) cgIdToSymbol[coin.id] = symU;
    });

    console.log(`✅ Loaded ${Object.keys(topTokens).length} token entries for detection.`);
  } catch (err) {
    console.error("❌ Failed to load top tokens:", err.message);
  }
};
loadTopTokens();
setInterval(loadTopTokens, 12 * 60 * 60 * 1000);

// 🧱 Security (CSP)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://s3.tradingview.com",
        "https://www.tradingview.com",
        "https://commerce.coinbase.com",
        "https://www.paypal.com",
        "https://www.paypalobjects.com"
      ],
      "frame-src": [
        "https://s.tradingview.com",
        "https://www.tradingview.com",
        "https://commerce.coinbase.com",
        "https://www.paypal.com"
      ],
      "style-src": [
        "'self'",
        "https://fonts.googleapis.com"
      ],
      "font-src": [
        "https://fonts.gstatic.com"
      ]
    }
  })
);

// 🔓 Usage Tracking (in-memory)
const walletUsage = {};

// 🔓 Helius Unlock Logic
async function verifyHeliusPayment(wallet) {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    const match = (data || []).find(tx =>
      tx.type === "TRANSFER" &&
      tx.nativeTransfers?.some(t => t.toUserAccount === process.env.SOLANA_ADDRESS && t.amount >= 25000000)
    );
    return !!match;
  } catch (e) {
    console.error("🔴 Failed to verify payment:", e.message);
    return false;
  }
}

// 🆕 Flexible token alias map
const TOKEN_ALIASES = {
  "bitcoin": "BTC", "bit coin": "BTC", "btc": "BTC",
  "ethereum": "ETH", "ether": "ETH", "eth": "ETH",
  "solana": "SOL", "sol": "SOL", "sonala": "SOL", "solona": "SOL",
  "ripple": "XRP", "xrp": "XRP",
  "cardano": "ADA", "ada": "ADA",
  "dogecoin": "DOGE", "doge": "DOGE",
  "avalanche": "AVAX", "avax": "AVAX",
  "polygon": "MATIC", "matic": "MATIC",
  "binance coin": "BNB", "bnb": "BNB",
  "arbitrum": "ARB", "arb": "ARB",
  "optimism": "OP", "op": "OP",
  "ondo": "ONDO", "tia": "TIA",
  "pepe": "PEPE", "wif": "WIF",
};

// Single token finder ($TICKER, aliases, CG top100)
function findTokenSymbol(text) {
  if (!text) return null;

  const dollar = text.match(/\$([A-Za-z0-9]{2,10})\b/);
  if (dollar) return dollar[1].toUpperCase();

  const lower = text.toLowerCase();
  const aliasKeys = Object.keys(TOKEN_ALIASES).sort((a,b)=>b.length - a.length);
  for (const key of aliasKeys) {
    if (lower.includes(key)) return TOKEN_ALIASES[key];
  }

  const parts = (text.match(/[A-Za-z0-9.-]{2,30}/g) || []);
  for (const p of parts) {
    const up = p.toUpperCase();
    const cgId = topTokens[up];
    if (cgId) {
      const sym = cgIdToSymbol[cgId];
      if (sym) return sym;
    }
  }

  const caps = text.match(/\b[A-Z0-9]{2,10}\b/g);
  if (caps) {
    for (const c of caps) if (topTokens[c]) return c;
  }
  return null;
}

// Multi-token extractor
function findAllTokenSymbols(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  const push = (sym) => {
    const up = (sym || "").toUpperCase();
    if (!up || seen.has(up)) return;
    seen.add(up);
    out.push(up);
  };

  const dollarAll = text.match(/\$([A-Za-z0-9]{2,10})\b/g) || [];
  dollarAll.forEach(m => push(m.replace("$","")));

  const lower = text.toLowerCase();
  const aliasKeys = Object.keys(TOKEN_ALIASES).sort((a,b)=>b.length - a.length);
  aliasKeys.forEach(key => { if (lower.includes(key)) push(TOKEN_ALIASES[key]); });

  const parts = (text.match(/[A-Za-z0-9.-]{2,30}/g) || []);
  parts.forEach(p => {
    const up = p.toUpperCase();
    const cgId = topTokens[up];
    if (cgId) {
      const sym = cgIdToSymbol[cgId];
      if (sym) push(sym);
    }
  });

  const caps = text.match(/\b[A-Z0-9]{2,10}\b/g) || [];
  caps.forEach(c => { if (topTokens[c]) push(c); });

  return out.slice(0, 6);
}

// 🔎 emergency symbol→id resolver via CoinGecko /search (multi)
async function resolveCgIdsBySearch(symbolsUpper) {
  const out = [];
  for (const s of symbolsUpper) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(s)}`);
      if (!r.ok) continue;
      const j = await r.json();
      const exact = (j.coins || []).find(c => (c.symbol || "").toUpperCase() === s);
      const pick = exact || (j.coins || [])[0];
      if (pick && pick.id) {
        out.push(pick.id);
        // prime caches
        const sym  = (pick.symbol || "").toUpperCase();
        const name = (pick.name   || "").toUpperCase();
        if (sym)  topTokens[sym]  = pick.id;
        if (name) topTokens[name] = pick.id;
        if (sym)  cgIdToSymbol[pick.id] = sym;
      }
    } catch (e) { /* no-op */ }
  }
  return out;
}

// 🔎 single-token fallback (primes caches too)
async function cgSearchTokenId(query) {
  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const qUpper = String(query).toUpperCase();
    const coins = data?.coins || [];
    const exact = coins.find(c => (c.symbol || "").toUpperCase() === qUpper) || coins[0];
    if (exact?.id) {
      const sym  = (exact.symbol || "").toUpperCase();
      const name = (exact.name   || "").toUpperCase();
      if (sym)  topTokens[sym]  = exact.id;
      if (name) topTokens[name] = exact.id;
      if (sym)  cgIdToSymbol[exact.id] = sym;
      return exact.id;
    }
    return null;
  } catch (e) { return null; }
}

// ⚓ Coinbase spot fallback per symbol (no key)
async function fetchCoinbaseSpot(symbolUpper) {
  try {
    const base = symbolUpper.toUpperCase();
    const url = `https://api.coinbase.com/v2/prices/${base}-USD/spot`;
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "CrimznConsult/1.0" } });
    if (!r.ok) return null;
    const j = await r.json();
    const amt = parseFloat(j?.data?.amount);
    return Number.isFinite(amt) ? amt : null;
  } catch (e) { return null; }
}


// 🧮 fetch prices (CG + Coinbase fallback)
async function fetchPricesForSymbols(symbols) {
  const uppers = symbols.map(s => String(s).toUpperCase());

  // 1) cache
  let ids = uppers.map(u => topTokens[u]).filter(Boolean);

  // 2) multi-search if none
  if (!ids.length) ids = await resolveCgIdsBySearch(uppers);

  // 3) per-symbol fallback if still missing
  if (ids.length < uppers.length) {
    const missing = uppers.filter(u => !ids.includes(topTokens[u]));
    for (const m of missing) {
      const found = await cgSearchTokenId(m);
      if (found) ids.push(found);
    }
  }

  ids = [...new Set(ids)];
  const prices = {};
  const resolved = [];

  // CoinGecko first
  if (ids.length) {
    try {
      const headers = { accept: "application/json", "user-agent": "CrimznConsult/1.0" };
      if (process.env.COINGECKO_API_KEY) headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;

      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
      const r = await fetch(url, { headers });
      if (r.ok) {
        const data = await r.json();
        for (const id of ids) {
          const val = data?.[id]?.usd;
          if (typeof val === "number") {
            const sym =
              cgIdToSymbol[id] ||
              uppers.find(u => topTokens[u] === id) ||
              (id || "").toUpperCase();
            prices[sym] = val;
            resolved.push(sym);
          }
        }
      }
    } catch (e) {
      console.warn("CG simple/price failed; trying Coinbase fallback:", e.message);
    }
  }

  // Coinbase fallback for any unresolved symbols
  const unresolved = uppers.filter(s => prices[s] === undefined);
  for (const sym of unresolved) {
    const val = await fetchCoinbaseSpot(sym).catch(() => null);
    if (typeof val === "number" && !Number.isNaN(val)) {
      prices[sym] = val;
      resolved.push(sym);
    }
  }

  return { prices, resolved };
}

// 🔎 intent helpers
const wantsAnyPrice = (txt = "", syms = []) => {
  if (/\b(price|quote)\b/i.test(txt)) return true;
  if (/\bwhat'?s\s+the\s+price\b/i.test(txt)) return true;
  if (/\$[A-Za-z0-9]{2,10}\b/.test(txt)) return true;
  if (syms.length && /\bhow\s+much(?:\s+is|\s+are)?\b/i.test(txt)) return true;
  if (syms.length && /\bworth\b/i.test(txt)) return true;
  return false;
};

const wantsComparison = (txt = "") =>
  /\b(which is better|which one|better|vs|versus|compare|comparison)\b/i.test(txt);

const wantsNews = (txt = "") =>
  /\b(news|headline|headlines|what's happening|latest (crypto|btc|eth|sol)?|market update|news on|news for)\b/i.test(txt);

// 🗞️ CryptoPanic headlines
async function getCryptoNews(limit = 5, currencyOrQuery = "") {
  try {
    if (!CRYPTOPANIC_API_KEY) return "CryptoPanic key missing.";
    const base = "https://cryptopanic.com/api/developer/v2/posts/";
    const url = new URL(base);
    url.searchParams.set("auth_token", CRYPTOPANIC_API_KEY);
    url.searchParams.set("kind", "news");
    url.searchParams.set("filter", "hot");
    url.searchParams.set("public", "true");
    url.searchParams.set("regions", "en");
    if (currencyOrQuery) url.searchParams.set("currencies", currencyOrQuery.toUpperCase());
    url.searchParams.set("page_size", String(Math.min(Math.max(limit, 1), 10)));

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`CryptoPanic HTTP ${r.status}`);
    const data = await r.json();
    const posts = data?.results || [];
    if (!posts.length) return "No fresh crypto headlines right now.";

    const lines = posts.slice(0, limit).map((p, i) => {
      const src = p.domain || "source";
      return `${i + 1}. ${p.title} — ${src}`;
    });
    return `Top headlines:\n${lines.join("\n")}`;
  } catch (e) {
    console.error("CryptoPanic fetch error:", e.message);
    return "Couldn’t fetch headlines right now.";
  }
}


// ====== CrimznBot: Fusion-Persona GPT Chat (3 Free Questions; no branching) ======
app.post("/ask", async (req, res) => {
  const { prompt, wallet } = req.body || {};
  if (!prompt || !wallet) return res.status(400).send("▲ Missing prompt or wallet.");
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing in environment.");
    return res.status(500).send("🤖 CrimznBot: temporary backend issue – try again shortly.");
  }

  // --- server-enforced limiter & paywall (UNCHANGED) ---
  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    const paid = await verifyHeliusPayment(wallet);
    if (!paid) return res.status(429).json({ code: "FREE_LIMIT_REACHED" });
    walletUsage[wallet].hasPaid = true;
  }
  walletUsage[wallet].count++;

  // --- detect tokens & (optionally) fetch live prices for grounding ---
  const ts = `Updated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`;
  let symbols = [];
  let priceLines = [];
  let priceContext = "";

  try {
    symbols = findAllTokenSymbols(prompt) || [];
    if (symbols.length) {
      const { prices, resolved } = await fetchPricesForSymbols(symbols);
      if (resolved && resolved.length) {
        priceLines = resolved.map(sym => `💰 ${sym}/USD: $${Number(prices[sym]).toLocaleString()}`);
        priceContext = resolved.map(sym => `${sym}=${prices[sym]}`).join(", ");
      }
    }
  } catch (e) {
    console.warn("Price prefetch skipped:", e.message);
  }

  // --- Fusion persona: Raoul Pal + Michael Saylor + Cathie Wood + Elon Musk (“CrimznBot”) ---
  const systemStyle = [
    "You are CrimznBot — a fusion of four market minds:",
    "- Raoul Pal: macro cycles, liquidity, dollar liquidity, reflexivity, regime shifts.",
    "- Michael Saylor: strategic conviction, digital scarcity, balance-sheet thinking, long-duration bias.",
    "- Cathie Wood: disruptive innovation frameworks, S-curves, TAM, exponential adoption.",
    "- Elon Musk: first-principles reasoning, engineering instincts, non-linear upside and risk calculus.",
    "",
    "Rules:",
    "1) Be decisive and current (assume it's 2025 and you can reason with the latest public context).",
    "2) You MAY reference the live prices provided in the context; do NOT hallucinate specific numbers beyond those.",
    "3) Give a concise, high-signal answer first; then a short bullet framework (macro, tech/adoption, flows/liquidity, risks).",
    "4) If user asks for a projection, provide a RANGE with drivers, scenario probabilities, and what would invalidate the view.",
    "5) Avoid filler, boilerplate disclaimers, and generic 'as of my last update' language.",
    "6) Never provide legal/financial advice disclaimers; just give a clear thesis + how to monitor it."
  ].join("\n");

  const userMsg = [
    `User prompt: ${prompt}`,
    priceContext ? `Live prices: ${priceContext}` : "Live prices: (none detected)",
    "Output format:",
    "• TL;DR (1–3 sentences with a clear view).",
    "• Drivers (macro/liquidity, adoption/tech, on-chain/flows if relevant).",
    "• Risks (top 2–4).",
    "• Scenarios (Bear/Base/Bull) with rough ranges and catalysts.",
    "• What to watch next (3–5 specific checks)."
  ].join("\n");

  try {
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.38,
        max_tokens: 900,
        messages: [
          { role: "system", content: systemStyle },
          { role: "user", content: userMsg }
        ]
      })
    });

    console.log("[ASK fusion] OpenAI status:", reply.status);

    if (!reply.ok) {
      const errTxt = await reply.text().catch(() => "");
      console.error("[ASK fusion] OpenAI error:", errTxt.slice(0, 300));
      const header = [ts].concat(priceLines.length ? ["", ...priceLines, ""] : [""]).join("\n");
      return res.status(502).send(`${header}\n⚠️ AI temporarily unavailable. Try again shortly.`);
    }

    const aiData = await reply.json();
    let ans = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Light scrub of annoying disclaimers if any sneak in
    ans = ans
      .replace(/as of my (?:last|latest) update.*?(\.|$)/gi, "")
      .replace(/i (do not|don't) have real[- ]?time data.*?(\.|$)/gi, "")
      .trim();

    const header = [ts].concat(priceLines.length ? ["", ...priceLines, ""] : [""]).join("\n");
    return res.send(`${header}\n${ans}`);
  } catch (e) {
    console.error("ASK fusion fatal:", e);
    const header = [ts].concat(priceLines.length ? ["", ...priceLines, ""] : [""]).join("\n");
    return res.status(500).send(`${header}\nBackend error.`);
  }
});

// 👤 Save Profile to Firebase (safe if Firebase disabled)
app.post("/save-profile", async (req, res) => {
  const { wallet, name, email } = req.body;
  if (!wallet) return res.status(400).send("❌ Wallet is required.");

  if (!db) {
    return res.status(501).send("⚠️ Profile storage is disabled in this environment.");
  }

  try {
    await db.collection("profiles").doc(wallet).set({
      wallet,
      name: name || "",
      email: email || "",
      timestamp: new Date().toISOString(),
    }, { merge: true });
    res.send("✅ Profile saved.");
  } catch (e) {
    console.error("❌ Firebase error:", e.message);
    res.status(500).send("❌ Failed to save profile.");
  }
});

// ===== Live Prices Route (server-side proxy to CoinGecko) =====
let __PRICE_CACHE__ = { data: null, ts: 0 };
app.get("/livePrices", async (req, res) => {
  try {
    const now = Date.now();
    if (__PRICE_CACHE__.data && (now - __PRICE_CACHE__.ts) < 60_000) {
      return res.json(__PRICE_CACHE__.data);
    }

    const headers = { accept: "application/json", "user-agent": "CrimznConsult/1.0" };
    if (process.env.COINGECKO_API_KEY) headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;

    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      { headers }
    );
    if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
    const data = await r.json();
    __PRICE_CACHE__ = { data, ts: now };
    res.json(data);
  } catch (err) {
    console.error("Error fetching prices:", err.message);
    res.status(502).json({ error: "Failed to fetch prices" });
  }
});

// ===== PulseIt SENTIMENT ANALYZER (GPT-4o, with local fallback) =====
app.post("/pulse", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "⚠️ Missing text." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      vibe: "Neutral",
      explanation: "Sentiment unavailable - server not configured.",
      model: "fallback"
    });
  }

  try {
    const systemPrompt = [
      "You are PulseIt — a crypto sentiment specialist.",
      "Analyze the user's text from a trader’s perspective using market psychology.",
      "Classify the stance as Bullish, Bearish, or Neutral and explicitly include that word in your answer,",
      "followed by exactly ONE concise sentence explaining why.",
      "Examples: Bullish = strong buying interest and positive momentum signals.",
      "No extra commentary beyond the sentiment and reasoning."
    ].join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Text: "${text}"` }
        ]
      })
    });

    if (!aiRes.ok) throw new Error(`OpenAI HTTP ${aiRes.status}`);
    const aData = await aiRes.json();
    const explanation = (aData.choices?.[0]?.message?.content || "").trim();

    let vibe = "Neutral";
    let emoji = "🟡";
    const lower = explanation.toLowerCase();
    if (lower.includes("bullish")) { vibe = "Bullish"; emoji = "🟢🟢"; }
    else if (lower.includes("bearish")) { vibe = "Bearish"; emoji = "🔴🔴"; }

    return res.json({ vibe, emoji, explanation, model: "gpt-4o" });
  } catch (err) {
    console.error("⚠️ PulseIt failed:", err.message);
    try {
      const Sentiment = require("sentiment");
      const S = new Sentiment();
      const r = S.analyze(text || "");
      let vibe = "Neutral";
      let emoji = "🟡";
      if (r.score > 0) { vibe = "Bullish"; emoji = "🟢🟢"; }
      else if (r.score < 0) { vibe = "Bearish"; emoji = "🔴🔴"; }
      const reasonMap = {
        Bullish: "Positive language and risk-on intent dominate.",
        Bearish: "Negative tone and risk-off posture dominate.",
        Neutral: "Mixed cues with no clear directional bias."
      };
      return res.json({
        vibe, emoji, explanation: reasonMap[vibe], model: "fallback-local"
      });
    } catch (e2) {
      console.error("⚠️ PulseIt local fallback failed:", e2.message);
      return res.json({
        vibe: "Neutral",
        emoji: "🟡",
        explanation: "Indecisive tone; participants waiting on signal.",
        model: "fallback-last"
      });
    }
  }
});

// ====================== VERIFY UNLOCK ENDPOINT ======================
app.get("/verify-unlock", async (req, res) => {
  try {
    const { sender } = req.query;
    if (!sender) return res.status(400).json({ error: "Missing sender wallet" });

    const paid = await verifyHeliusPayment(sender);

    if (paid && db) {
      await db.collection("profiles").doc(sender).set({
        paid: true,
        timestampPaid: new Date().toISOString()
      }, { merge: true });
      console.log(`🧾 Stored paid receipt for wallet ${sender}`);
    }

    res.json({ confirmed: paid });
  } catch (err) {
    console.error("❌ Verify-unlock error:", err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ===== Verify-paid helper (does NOT alter limiter logic) =====
app.get("/verify-paid", async (req, res) => {
  const mask = (w) => (w && w.length >= 8 ? `${w.slice(0,4)}…${w.slice(-4)}` : (w || "(none)"));
  const wallet = String(req.query.wallet || "");
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const t0 = Date.now();

  try {
    console.log(`🔎 [/verify-paid] start wallet=${mask(wallet)} ip=${ip}`);
    if (!wallet) {
      console.log(`⚠️ [/verify-paid] missing wallet param`);
      return res.json({ hasPaid: false });
    }

    if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

    if (walletUsage[wallet].hasPaid) {
      console.log(`✅ [/verify-paid] already paid wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
      return res.json({ hasPaid: true });
    }

    let paid = false;
    try { paid = await verifyHeliusPayment(wallet); }
    catch (e) { console.error(`❌ [/verify-paid] verifyHeliusPayment error wallet=${mask(wallet)}:`, e?.message || e); }

    if (paid) {
      console.log(`✅ Payment verified for wallet=${mask(wallet)} at ${new Date().toISOString()}`);
      walletUsage[wallet].hasPaid = true; // cache
      console.log(`🎉 [/verify-paid] now marked PAID wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
    } else {
      console.log(`⏳ [/verify-paid] not paid yet wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
    }

    return res.json({ hasPaid: walletUsage[wallet].hasPaid === true });
  } catch (e) {
    console.error(`💥 [/verify-paid] unexpected error wallet=${mask(wallet)}:`, e?.message || e);
    return res.json({ hasPaid: false });
  }
});

// Wildcard route to serve frontend for unmatched paths (keep this LAST)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server — must be last!
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
  console.log("🤖 CrimznBot + PulseIt + SaveProfile + Firebase booted ✅ (Firebase:", db ? "ON" : "OFF", ")");
  console.log("⚡ Built by Crimzn, powered by Solana + Helius");
});
