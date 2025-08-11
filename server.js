console.log("🚀 CryptoConsult server v=crimznAug10v7 loaded", new Date().toISOString());
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const sentiment = require("sentiment");
const { PublicKey } = require("@solana/web3.js");

// 🔍 ENV Debug
console.log("🧪 Starting ENV Debug Mode...");
console.log("🔐 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? "FOUND" : "❌ MISSING");
console.log("🔑 HELIUS_API_KEY:", process.env.HELIUS_API_KEY ? "FOUND" : "❌ MISSING");
console.log("💼 SOLANA_ADDRESS:", process.env.SOLANA_ADDRESS ? "FOUND" : "❌ MISSING");
console.log("🧠 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "FOUND" : "❌ MISSING");

// 🔐 Firebase Admin Setup (base64-encoded key in Render)
const admin = require("firebase-admin");

let serviceAccount;
try {
  const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
  serviceAccount = JSON.parse(decodedKey);
} catch (e) {
  console.error("❌ Error parsing Firebase key:", e.message);
}

if (!admin.apps.length) {
  try {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
    console.log("✅ Firebase Admin initialized");
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e.message);
  }
}

const db = admin.firestore();

// ⚙️ App Init
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

// ===== Load top 100 tokens on startup =====
let topTokens = {};

const loadTopTokens = async () => {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    );
    if (!r.ok) throw new Error(`CG top tokens HTTP ${r.status}`);
    const data = await r.json();

    // Store both ticker and name in uppercase for detection
    topTokens = {};
    data.forEach((coin) => {
      topTokens[coin.symbol.toUpperCase()] = coin.id;
      topTokens[coin.name.toUpperCase()] = coin.id;
    });

    console.log(`✅ Loaded ${Object.keys(topTokens).length} token entries for detection.`);
  } catch (err) {
    console.error("❌ Failed to load top tokens:", err.message);
  }
};

// Load immediately and refresh every 12 hours
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
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      "font-src": [
        "https://fonts.gstatic.com"
      ]
    }
  })
);

// 🔓 Usage Tracking
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

// 🧠 CrimznBot: Token Lookup + GPT-4o Crypto Chat (3 Free Questions)
app.post("/ask", async (req, res) => {
    const { prompt, wallet } = req.body;

  if (!prompt || !wallet) return res.status(400).send("⚠️ Missing prompt or wallet.");
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing in environment.");
    return res.status(500).send("🧠 CrimznBot: temporary backend issue — try again shortly.");
  }

if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

// Server-enforced limit (ignore any client "hasPaid")
if (!walletUsage[wallet].hasPaid) {
  if (walletUsage[wallet].count >= 3) {
    const paid = await verifyHeliusPayment(wallet);
    if (!paid) {
      return res.status(429).json({ code: "FREE_LIMIT_REACHED" }); // ✅ send code, not words
    }
    walletUsage[wallet].hasPaid = true; // first verified payment → mark as paid
  }
}


walletUsage[wallet].count++;

// === Price detection using cached top 100 (no paywall changes) ===
const wantsPrice = (txt) => {
  const t = txt.toLowerCase();
  return /\b(price|quote|worth|trading at|usd|usdt)\b/.test(t)
      || /\bwhat'?s\s+the\s+price\b/.test(t)
      || /^\$?[A-Za-z]{2,10}\s*\/\s*(USD|USDT)\b/i.test(txt);
};

const extractTickerOrName = (txt) => {
  const dollar = txt.match(/\$([A-Za-z]{2,10})\b/);
  if (dollar) return dollar[1].toUpperCase();

  const ofMatch = txt.match(/\bprice\s+of\s+([A-Za-z0-9 .-]{2,30})/i);
  if (ofMatch) return ofMatch[1].trim().toUpperCase();

  const slash = txt.match(/\b([A-Za-z]{2,10})\s*\/\s*(USD|USDT)\b/i);
  if (slash) return slash[1].toUpperCase();

  const caps = txt.match(/\b[A-Z]{2,10}\b/g);
  if (caps && caps.length) return caps[caps.length - 1].toUpperCase();

  return null;
};

try {
  if (wantsPrice(prompt)) {
    const query = extractTickerOrName(prompt);
    const cgId = query ? topTokens[query] : null;

    if (cgId) {
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=usd`
      );
      if (r.ok) {
        const data = await r.json();
        const price = data?.[cgId]?.usd;
        if (typeof price === "number") {
          return res.send(`💰 ${query}/USD: $${Number(price).toLocaleString()}`);
        }
      }
    }
    // unresolved → fall through to GPT
  }
} catch (pxErr) {
  console.warn("Price detection failed (falling back to GPT):", pxErr.message);
}

// === GPT-4o tone-locked answer for everything else ===
try {
  const systemStyle = [
    "You are CrimznBot — a pro crypto analyst with conviction.",
    "Tone: concise, confident, strategic, slight degen edge; no fluff.",
    "Hard rules:",
    "- Never say 'as of my last update' or mention knowledge cutoffs.",
    "- Never apologize for not having real-time data.",
    "- Start with 'Quick take:' then 3–6 tight bullets.",
    "- Focus on levels, catalysts, flows, risk, invalidation.",
    "- Keep it under ~180 words unless asked for a deep dive.",
    "- Use tickers (BTC, ETH, SOL, etc.) and plain Markdown."
  ].join("\n");

  const reply = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.6,
      max_tokens: 700,
      messages: [
        { role: "system", content: systemStyle },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!reply.ok) throw new Error(`OpenAI HTTP ${reply.status}`);
  const aiData = await reply.json();
  let answer = aiData.choices?.[0]?.message?.content || "";

  // scrub any stray disclaimers
  answer = answer
    .replace(/as of my (?:last|latest) update.*?(\.|$)/gi, "")
    .replace(/i (do not|don't) have real[- ]?time data.*?(\.|$)/gi, "")
    .trim();

  if (answer && !/^quick take:/i.test(answer)) {
    answer = answer.replace(/^\s*/, "Quick take: ").trim();
  }

  return res.send(answer || "Quick take: Trade the levels; keep risk tight and let liquidity lead.");
} catch (err) {
  console.error("❌ CrimznBot error:", err.message);
  return res.send("🧠 CrimznBot (fallback): Keep risk tight and let liquidity tell the story.");
}

}); // closes app.post("/ask")

// 👤 Save Profile to Firebase
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

// ====== Live Prices Route (server-side proxy to CoinGecko) ======
app.get("/livePrices", async (req, res) => {
  try {
    // ✅ FIX: add lightweight cache + user-agent header to reduce CoinGecko rate-limit failures
    if (!global.__PRICE_CACHE__) {
      global.__PRICE_CACHE__ = { data: null, ts: 0 };
    }
    const now = Date.now();
    if (global.__PRICE_CACHE__.data && (now - global.__PRICE_CACHE__.ts) < 60_000) {
      return res.json(global.__PRICE_CACHE__.data);
    }

    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      {
        headers: {
          "accept": "application/json",
          "user-agent": "CrimznConsult/1.0", // ✅ FIX: helps avoid some public API blocks
        },
      }
    );
    if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
    const data = await r.json();

    // ✅ FIX: cache the successful response for 60s
    global.__PRICE_CACHE__ = { data, ts: now };

    res.json(data);
  } catch (err) {
    console.error("Error fetching prices:", err.message);
    res.status(502).json({ error: "Failed to fetch prices" }); // unchanged response shape
  }
});

// ======== PULSEIT SENTIMENT ANALYZER (GPT-4o, 🟢🔴⚪) ========
app.post("/pulse", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "⚠️ Missing text." });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY missing for PulseIt.");
    return res.json({
      vibe: "Neutral",
      emoji: "⚪",
      explanation: "Sentiment unavailable — server not configured.",
      model: "fallback"
    });
  }

  try {
const systemPrompt =
  "You are PulseIt — a crypto sentiment specialist. " +
  "Analyze the user's text from a trader's perspective using market psychology. " +
  "Classify the sentiment as Bullish, Bearish, or Neutral and explicitly include that word in your answer, " +
  "followed by exactly ONE concise sentence explaining WHY. " +
  "Example: 'Bullish — strong buying interest and positive momentum signals.' " +
  "No extra commentary beyond the sentiment and reasoning.";

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Text: "${text}"` }
        ],
        temperature: 0.2
      })
    });

    if (!aiRes.ok) throw new Error(`OpenAI HTTP ${aiRes.status}`);
    const aiData = await aiRes.json();
    const explanation = (aiData.choices?.[0]?.message?.content || "").trim();

    // Decide emoji + vibe from the explanation text
    let vibe = "Neutral";
    let emoji = "⚪";
    const lower = explanation.toLowerCase();
    if (lower.includes("bullish")) { vibe = "Bullish"; emoji = "🟢"; }
    else if (lower.includes("bearish")) { vibe = "Bearish"; emoji = "🔴"; }

    return res.json({ vibe, emoji, explanation, model: "gpt-4o" });

  } catch (err) {
    console.error("⚠️ PulseIt failed:", err.message);
    try {
      // Local fallback using 'sentiment'
      const Sentiment = require("sentiment");
      const s = new Sentiment();
      const r = s.analyze(text || "");

      let vibe = "Neutral";
      let emoji = "⚪";
      if (r.score > 0) { vibe = "Bullish"; emoji = "🟢"; }
      else if (r.score < 0) { vibe = "Bearish"; emoji = "🔴"; }

      const reasonMap = {
        Bullish: "Positive language and risk-on intent dominate.",
        Bearish: "Negative tone and risk-off posture dominate.",
        Neutral: "Mixed cues with no clear directional bias."
      };

      return res.json({
        vibe,
        emoji,
        explanation: reasonMap[vibe],
        model: "fallback-local"
      });
    } catch (e2) {
      console.error("PulseIt local fallback failed:", e2.message);
      return res.json({
        vibe: "Neutral",
        emoji: "⚪",
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
    res.json({ confirmed: paid });
  } catch (err) {
    console.error("❌ Verify-unlock error:", err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ===== Verify-paid helper with logging (does NOT alter limiter logic) =====
app.get("/verify-paid", async (req, res) => {
  // FIX 1: template literals now wrapped in backticks
  const mask = (w) => (w && w.length >= 8 ? `${w.slice(0,4)}…${w.slice(-4)}` : (w || "(none)"));
  const wallet = String(req.query.wallet || "");
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const t0 = Date.now();

  try {
    // FIX 2: console.log string wrapped in backticks
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

    // on-chain verification
    let paid = false;
    try {
      paid = await verifyHeliusPayment(wallet);
    } catch (e) {
      console.error(`❌ [/verify-paid] verifyHeliusPayment error wallet=${mask(wallet)}:`, e?.message || e);
    }

    if (paid) {
      walletUsage[wallet].hasPaid = true;
      console.log(`🎉 [/verify-paid] now marked PAID wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
    } else {
      console.log(`⏳ [/verify-paid] not paid yet wallet=${mask(wallet)} (+${Date.now()-t0}ms)`);
    }

    return res.json({ hasPaid: walletUsage[wallet].hasPaid === true });
  } catch (e) {
    // FIX 2: console.error string wrapped in backticks
    console.error(`💥 [/verify-paid] unexpected error wallet=${mask(wallet)}:`, e?.message || e);
    return res.json({ hasPaid: false });
  }
});
// ===== /Verify-paid helper =====

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




