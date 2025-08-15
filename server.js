// ─────────────────────────────────────────────────────────────────────────────
// Crimzn Consult Backend
// ─────────────────────────────────────────────────────────────────────────────
console.log("🚀 Crimzn Consult Backend v=crimznAug15v1", new Date().toString());
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
const sentiment = require("sentiment");
const { PublicKey } = require("@solana/web3.js");

// 🆕 NEW: capture CryptoPanic key from env
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY;

// 🔐 Firebase Admin Setup (base64-encoded key in Render)
const admin = require("firebase-admin");

// 🔍 ENV Debug
console.log("🧪 Starting ENV Debug Mode...");
console.log("🔐 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? "FOUND" : "❌ MISSING");
console.log("🔑 HELIUS_API_KEY:", process.env.HELIUS_API_KEY ? "FOUND" : "❌ MISSING");
console.log("💼 SOLANA_ADDRESS:", process.env.SOLANA_ADDRESS ? "FOUND" : "❌ MISSING");
console.log("🧠 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "FOUND" : "❌ MISSING");
// 🆕 NEW: env debug line for CryptoPanic
console.log("📰 CRYPTOPANIC_API_KEY:", CRYPTOPANIC_API_KEY ? "FOUND" : "❌ MISSING");

let serviceAccount;
try {
  const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
  serviceAccount = JSON.parse(decodedKey);
} catch (e) {
  console.error("❌ Error parsing Firebase key:", e.message);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase Admin initialized");
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e.message);
  }
}
const db = admin.firestore();

// ⚙️ App Init
const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

// ===== Load top 100 tokens on startup =====
// 🆕 UPDATED: track both symbol/name → cgId, and cgId → symbol for reverse lookup
let topTokens = {};          // { SYMBOL_UPPER: cgId, NAME_UPPER: cgId }
let cgIdToSymbol = {};       // { cgId: SYMBOL_UPPER }

const loadTopTokens = async () => {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    );
    if (!r.ok) throw new Error(`CG top tokens HTTP ${r.status}`);
    const data = await r.json();

    topTokens = {};
    cgIdToSymbol = {};

    data.forEach((coin) => {
      const symU = (coin.symbol || "").toUpperCase();
      const nameU = (coin.name   || "").toUpperCase();
      if (symU)  topTokens[symU]  = coin.id;
      if (nameU) topTokens[nameU] = coin.id;
      if (coin.id && symU) cgIdToSymbol[coin.id] = symU; // reverse map for pretty symbols
    });

    console.log(`✅ Loaded ${Object.keys(topTokens).length} token entries for detection.`);
  } catch (err) {
    console.error("❌ Failed to load top tokens:", err.message);
  }
};
loadTopTokens();
setInterval(loadTopTokens, 12 * 60 * 60 * 1000);

// 🧱 Middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
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
    const match = data.find(tx =>
      tx.type === "TRANSFER" &&
      tx.nativeTransfers?.some(t => t.toUserAccount === process.env.SOLANA_ADDRESS && t.amount >= 25000000)
    );
    return !!match;
  } catch (e) {
    console.error("🔴 Failed to verify payment:", e.message);
    return false;
  }
}

// 🆕 NEW: flexible token alias map + robust finder (handles caps/lower/title + names + typos)
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

function findTokenSymbol(text) {
  if (!text) return null;

  // $TOKEN style
  const dollar = text.match(/\$([A-Za-z0-9]{2,10})\b/);
  if (dollar) return dollar[1].toUpperCase();

  const lower = text.toLowerCase();

  // alias dictionary (longest first to catch multi-word like "binance coin")
  const aliasKeys = Object.keys(TOKEN_ALIASES).sort((a,b)=>b.length - a.length);
  for (const key of aliasKeys) {
    if (lower.includes(key)) return TOKEN_ALIASES[key];
  }

  // try any alphanumeric chunk against our CoinGecko name/symbol index (top 100 cache)
  const parts = (text.match(/[A-Za-z0-9.-]{2,30}/g) || []);
  for (const p of parts) {
    const up = p.toUpperCase();
    const cgId = topTokens[up];       // could be name ("SOLANA") or symbol ("SOL")
    if (cgId) {
      const sym = cgIdToSymbol[cgId]; // canonical symbol like "SOL"
      if (sym) return sym;
    }
  }

  // last resort: scan for ALL-CAPS token-like words present in our index
  const caps = text.match(/\b[A-Z0-9]{2,10}\b/g);
  if (caps) {
    for (const c of caps) if (topTokens[c]) return c;
  }

  return null;
}

// 🆕 NEW: extract ALL token symbols from arbitrary text (names/case/$TICKER/typos)
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

  // $TICKER matches
  const dollarAll = text.match(/\$([A-Za-z0-9]{2,10})\b/g) || [];
  dollarAll.forEach(m => push(m.replace("$","")));

  // Alias dictionary (longest first)
  const lower = text.toLowerCase();
  const aliasKeys = Object.keys(TOKEN_ALIASES).sort((a,b)=>b.length - a.length);
  aliasKeys.forEach(key => { if (lower.includes(key)) push(TOKEN_ALIASES[key]); });

  // Any chunk → CoinGecko name/symbol index
  const parts = (text.match(/[A-Za-z0-9.-]{2,30}/g) || []);
  parts.forEach(p => {
    const up = p.toUpperCase();
    const cgId = topTokens[up];
    if (cgId) {
      const sym = cgIdToSymbol[cgId];
      if (sym) push(sym);
    }
  });

  // ALL-CAPS tokens present in our index
  const caps = text.match(/\b[A-Z0-9]{2,10}\b/g) || [];
  caps.forEach(c => { if (topTokens[c]) push(c); });

  return out.slice(0, 6); // sane limit
}

// 🆕 NEW: fetch CoinGecko prices for multiple symbols
async function fetchPricesForSymbols(symbols) {
  const ids = symbols
    .map(s => topTokens[String(s).toUpperCase()])
    .filter(Boolean);

  if (!ids.length) return { prices: {}, resolved: [] };

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
  const data = await r.json();

  const prices = {};
  const resolved = [];
  ids.forEach(id => {
    const sym = cgIdToSymbol[id];
    const val = data?.[id]?.usd;
    if (sym && typeof val === "number") {
      prices[sym] = val;
      resolved.push(sym);
    }
  });
  return { prices, resolved };
}

// 🆕 NEW: quick intent helpers
const wantsAnyPrice = (txt="") =>
  /\b(price|quote|worth|trading at|usd|usdt)\b/i.test(txt) ||
  /\bwhat'?s\s+the\s+price\b/i.test(txt) ||
  /\$[A-Za-z0-9]{2,10}\b/.test(txt);

const wantsComparison = (txt="") =>
  /\b(which is better|which one|better|vs|versus|compare|comparison)\b/i.test(txt);

// 🆕 NEW: server-side CryptoPanic helper (no CSP change needed)
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
    if (currencyOrQuery) url.searchParams.set("currencies", currencyOrQuery.toUpperCase()); // e.g., BTC, SOL
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

// ====== CrimznBot: Token Lookup + GPT-4o Crypto Chat (3 Free Questions) ======
app.post("/ask", async (req, res) => {
  const { prompt, wallet } = req.body;

  if (!prompt || !wallet) return res.status(400).send("⚠️ Missing prompt or wallet.");
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing in environment.");
    return res.status(500).send("🧠 CrimznBot: temporary backend issue — try again shortly.");
  }

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  // ✅ keeps: server-enforced limiter & paywall
  if (!walletUsage[wallet].hasPaid) {
    if (walletUsage[wallet].count >= 3) {
      const paid = await verifyHeliusPayment(wallet);
      if (!paid) {
        return res.status(429).json({ code: "FREE_LIMIT_REACHED" });
      }
      walletUsage[wallet].hasPaid = true; // first verified payment → mark as paid
    }
  }
  walletUsage[wallet].count++;

  // 🆕 NEW: multi-token detection up front
  const symbols = findAllTokenSymbols(prompt); // e.g., ["ONDO","SOL","ETH"]
  const askedPrice = wantsAnyPrice(prompt);
  const askedCompare = wantsComparison(prompt);

  // ===== Price branch (supports 1..N tokens) =====
  try {
    if (askedPrice && symbols.length) {
      const { prices, resolved } = await fetchPricesForSymbols(symbols);

      if (resolved.length) {
        const ts = `Updated: ${new Date().toISOString().replace("T"," ").slice(0,16)} UTC`;
        const lines = resolved.map(sym => `💰 ${sym}/USD: $${Number(prices[sym]).toLocaleString()}`);

        // 🆕 NEW: comparison path if user asked "which is better"
        if (askedCompare && resolved.length >= 2) {
          const comparePairs = resolved.join(", ");
          const priceContext = resolved.map(sym => `${sym}=${prices[sym]}`).join(", ");

          const systemStyle = [
            "You are CrimznBot — a crypto strategist. Be decisive and current.",
            "Never invent numbers. Use provided price context when relevant.",
            "Prefer concise bullets, then a clear one-line verdict and confidence (0-100)."
          ].join("\n");

          const userMsg = [
            `User asked: ${prompt}`,
            `Live prices: ${priceContext}`,
            `Compare the mentioned assets (${comparePairs}).`,
            `Output:`,
            `- 3-6 crisp bullets (thesis, security/decentralization, costs, performance/throughput, ecosystem/dev).`,
            `- Then a single-line Verdict with a Winner (one ticker or 'split') and Confidence (0-100).`
          ].join("\n");

          const reply = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              temperature: 0.35,
              max_tokens: 700,
              messages: [
                { role: "system", content: systemStyle },
                { role: "user", content: userMsg }
              ]
            })
          });

          if (!reply.ok) {
            const errTxt = await reply.text().catch(()=> "");
            console.error("[ASK compare] OpenAI error:", errTxt.slice(0,200));
            // fall back to prices only
            return res.send(`${ts}\n\n${lines.join("\n")}`);
          }

          const ai = await reply.json();
          let analysis = ai.choices?.[0]?.message?.content?.trim() || "";
          analysis = analysis
            .replace(/as of my (?:last|latest) update.*?(\.|$)/gi, "")
            .replace(/i (do not|don't) have real[- ]?time data.*?(\.|$)/gi, "")
            .trim();

          return res.send(`${ts}\n\n${lines.join("\n")}\n\n${analysis}`);
        }

        // Otherwise: just return prices
        return res.send(`${ts}\n\n${lines.join("\n")}`);
      }
      // unresolved → fall through
    }
  } catch (e) {
    console.warn("Multi-price flow failed, continuing:", e.message);
  }

  // 📰 News branch (dynamic symbol via finder)
  try {
    const lower = (prompt || "").toLowerCase();
    if (/\b(news|headline|headlines|what's happening|latest (crypto|btc|eth|sol)?|market update)\b/.test(lower)) {
      const sym = findTokenSymbol(prompt) || ""; // names/case/typos supported
      const headlines = await getCryptoNews(5, sym);
      const ts = `Updated: ${new Date().toISOString().replace("T"," ").slice(0,16)} UTC`;
      return res.send(`${ts}\n\n${headlines}`);
    }
  } catch (newsErr) {
    console.warn("News fetch failed (continuing to GPT):", newsErr.message);
  }

  // ===== GPT-4o for everything else (with timestamp) =====
  try {
    const systemStyle = [
      "You are CrimznBot — a crypto and market strategist.",
      "Be decisive and current. Avoid filler and generic disclaimers.",
      "If numbers are uncertain, give a framework and what to check now.",
      "Tone: confident, strategic, slightly degen when appropriate, deeply analytical."
    ].join("\n");

    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: systemStyle },
          { role: "user", content: prompt }
        ]
      })
    });

    console.log("[ASK] OpenAI status:", reply.status);
    if (!reply.ok) {
      const errTxt = await reply.text().catch(() => "");
      console.error("[ASK] OpenAI error body:", errTxt.slice(0, 300));
      throw new Error(`OpenAI HTTP ${reply.status}`);
    }

    const aiData = await reply.json();
    let answer = aiData.choices?.[0]?.message?.content || "";

    const ts = `Updated: ${new Date().toISOString().replace("T"," ").slice(0,16)} UTC`;
    answer = answer
      .replace(/as of my (?:last|latest) update.*?(\.|$)/gi, "")
      .replace(/i (do not|don't) have real[- ]?time data.*?(\.|$)/gi, "")
      .trim();
    if (!/^Updated: /.test(answer)) answer = `${ts}\n\n${answer}`;

    return res.send(answer || "Trade the levels; keep risk tight and let liquidity lead.");
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    return res.send("🧠 CrimznBot (fallback): Keep risk tight and let liquidity tell the story.");
  }
}); // closes app.post("/ask")

// 👤 Save Profile to Firebase (unchanged)
app.post("/save-profile", async (req, res) => {
  const { wallet, name, email } = req.body;
  if (!wallet) return res.status(400).send("❌ Wallet is required.");

  try {
    await db.collection("profiles").doc(wallet).set({
      wallet,
      name: name || "",
      email: email || "",
      timestamp: new Date().toISOString(),
    });
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
    if (!__PRICE_CACHE__) __PRICE_CACHE__ = { data: null, ts: 0 };
    const now = Date.now();
    if (__PRICE_CACHE__.data && (now - __PRICE_CACHE__.ts) < 60_000) {
      return res.json(__PRICE_CACHE__.data);
    }

    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      { headers: { accept: "application/json", "user-agent": "CrimznConsult/1.0" } }
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

    // Decide emoji + vibe from the explanation text
    let vibe = "Neutral";
    let emoji = "🟡";
    const lower = explanation.toLowerCase();
    if (lower.includes("bullish")) { vibe = "Bullish"; emoji = "🟢🟢"; }
    else if (lower.includes("bearish")) { vibe = "Bearish"; emoji = "🔴🔴"; }

    return res.json({ vibe, emoji, explanation, model: "gpt-4o" });
  } catch (err) {
    console.error("⚠️ PulseIt failed:", err.message);
    try {
      // Local fallback using 'sentiment'
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

    // ✅ Store passive receipt (does not control unlock)
    if (paid) {
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

// ===== Verify-paid helper with logging (does NOT alter limiter logic) =====
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

    // ensure record exists
    if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

    // already paid? quick yes
    if (walletUsage[wallet].hasPaid) {
      console.log(`✅ [/verify-paid] already paid wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
      return res.json({ hasPaid: true });
    }

    // on-chain verification (wrapped)
    let paid = false;
    try {
      paid = await verifyHeliusPayment(wallet);
    } catch (e) {
      console.error(`❌ [/verify-paid] verifyHeliusPayment error wallet=${mask(wallet)}:`, e?.message || e);
    }

    if (paid) {
      console.log(`✅ Payment verified for wallet=${mask(wallet)} at ${new Date().toISOString()}`);
      walletUsage[wallet].hasPaid = true; // cache for this runtime
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
  console.log("🤖 CrimznBot + PulseIt + SaveProfile + Firebase booted ✅");
  console.log("⚡ Built by Crimzn, powered by Solana + Helius");
});
