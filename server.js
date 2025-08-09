// 🔥 Crimzn Consult Backend - Final Merge: gpt-4o + Firebase + CrimznBot + PulseIt
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

// ====== Price helpers: static aliases + dynamic CoinGecko resolver + in-memory cache ======
const tokenMap = {
  // Tier 1
  bitcoin: "bitcoin", btc: "bitcoin",
  ethereum: "ethereum", eth: "ethereum",
  solana: "solana", sol: "solana",
  tether: "tether", usdt: "tether",
  "usd-coin": "usd-coin", usdc: "usd-coin",
  bnb: "binancecoin", "binance coin": "binancecoin",
  xrp: "ripple", ripple: "ripple",
  cardano: "cardano", ada: "cardano",
  dogecoin: "dogecoin", doge: "dogecoin",
  tron: "tron", trx: "tron",
  "the open network": "the-open-network", ton: "the-open-network",

  // Tier 2
  polkadot: "polkadot", dot: "polkadot",
  avalanche: "avalanche-2", avax: "avalanche-2",
  shib: "shiba-inu", shiba: "shiba-inu", "shiba inu": "shiba-inu",
  chainlink: "chainlink", link: "chainlink",
  litecoin: "litecoin", ltc: "litecoin",
  "bitcoin cash": "bitcoin-cash", bch: "bitcoin-cash",
  matic: "polygon-pos", polygon: "polygon-pos", maticnetwork: "polygon-pos",
  optimism: "optimism", op: "optimism",
  arbitrum: "arbitrum", arb: "arbitrum",
  aptos: "aptos", apt: "aptos",
  sui: "sui", sui_: "sui",
  injective: "injective", inj: "injective",
  near: "near", "near protocol": "near",
  cosmos: "cosmos", atom: "cosmos",
  stellar: "stellar", xlm: "stellar",
  monero: "monero", xmr: "monero",
  "ethereum classic": "ethereum-classic", etc: "ethereum-classic",
  filecoin: "filecoin", fil: "filecoin",

  // DeFi / infra
  aave: "aave",
  maker: "maker", mkr: "maker",
  curve: "curve-dao-token", crv: "curve-dao-token",
  uniswap: "uniswap", uni: "uniswap",
  lido: "lido-dao", ldo: "lido-dao",
  dydx: "dydx-chain", "dydx chain": "dydx-chain",

  // Infra / L2 / data
  starknet: "starknet", strk: "starknet",
  "the graph": "the-graph", grt: "the-graph",
  immutable: "immutable", imx: "immutable",
  arweave: "arweave", ar: "arweave",
  render: "render", rndr: "render",

  // New/Popular
  pepe: "pepe",
  dogwifhat: "dogwifcoin", wif: "dogwifcoin",
  bonk: "bonk",
  pyth: "pyth-network",
  jto: "jito-governance-token",
  ondo: "ondo-finance",
  rune: "thorchain",
  stx: "stacks",
  sei: "sei-network",
  tia: "celestia",
  ftm: "fantom",
  sand: "the-sandbox",
  axs: "axie-infinity",
  ens: "ethereum-name-service",
};

const tokenIdCache = new Map(); // input -> coingecko id

function normalizeTokenInput(s = "") {
  return s.toLowerCase().trim().replace(/^[\s$#@]+/, "").replace(/\s+/g, " ");
}

async function resolveTokenId(inputRaw) {
  const input = normalizeTokenInput(inputRaw);

  // 1) fast path: static alias
  if (tokenMap[input]) return tokenMap[input];

  // 2) cache
  if (tokenIdCache.has(input)) return tokenIdCache.get(input);

  // 3) dynamic lookup via CoinGecko search
  try {
    const resp = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(input)}`);
    if (!resp.ok) throw new Error(`CG search ${resp.status}`);
    const data = await resp.json();

    const coins = Array.isArray(data?.coins) ? data.coins : [];
    if (!coins.length) return null;

    // Heuristics: exact symbol match > name contains > first
    const bySymbolExact = coins.find(c => (c.symbol || "").toLowerCase() === input);
    const byNameContains = coins.find(c => (c.name || "").toLowerCase().includes(input));
    const pick = bySymbolExact || byNameContains || coins[0];

    if (pick?.id) {
      tokenIdCache.set(input, pick.id);
      return pick.id;
    }
  } catch (_) {
    // ignore, fallthrough
  }

  return null;
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

// If not marked paid yet, enforce the 3-free limit server-side only
if (!walletUsage[wallet].hasPaid) {
  if (walletUsage[wallet].count >= 3) {
    const paid = await verifyHeliusPayment(wallet);
    if (!paid) {
      return res.send("⚠️ 3 free questions used. Unlock CrimznBot with 0.025 SOL.");
    }
    // First verified payment → unlock
    walletUsage[wallet].hasPaid = true;
  }
}

walletUsage[wallet].count++;

try {
  // ---------- Price shortcut (ONLY when clearly about price) ----------
  const priceIntent = /\b(price|quote|how much|worth|usd|\$|current price|live)\b/i;

  // collect candidates from aliases and $SYMBOL in the prompt
  const lower = (prompt || "").toLowerCase();
  const words = lower.split(/[^a-z0-9.+-]+/).filter(Boolean);

  // static alias hits
  const aliasHits = [];
  for (const w of words) {
    if (tokenMap[w]) aliasHits.push(w);
  }

  // $symbol hits (e.g., $sol, $eth)
  const symbolHits = (prompt.match(/\$[a-z0-9]+/gi) || []).map(s => s.slice(1).toLowerCase());

  // unify candidate list
  const candidates = [...new Set([...aliasHits, ...symbolHits])];

  if (priceIntent.test(prompt) && candidates.length) {
    // resolve to CoinGecko ids (static first, then dynamic)
    const ids = [];
    for (const c of candidates) {
      const id = tokenMap[c] || await resolveTokenId(c);
      if (id) ids.push(id);
    }
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length) {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds.join(",")}&vs_currencies=usd`;
      const priceData = await fetch(url).then(r => r.json());
      const lines = uniqueIds.map(id => {
        const v = priceData?.[id]?.usd;
        return v ? `💰 ${id.toUpperCase()}: $${Number(v).toLocaleString()}` : `💰 ${id.toUpperCase()}: N/A`;
      });
      return res.send(lines.join(" • "));
    }
    // if nothing resolvable, fall through to OpenAI
  }

  // ---------- Not a price question → GPT-4o ----------
  const reply = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot — a professional crypto market analyst combining the vision, conviction, " +
            "and style of Raoul Pal, Michael Saylor, Elon Musk, Cathie Wood, and other top macro and tech investors. " +
            "Blend deep macroeconomic insight, blockchain adoption trends, and innovative strategy with sharp, " +
            "market-savvy trading perspectives. Be forward-looking, conviction-driven, and analytical. " +
            "Avoid disclaimers. Keep responses confident, actionable, and grounded in data and narrative."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!reply.ok) throw new Error(`OpenAI HTTP ${reply.status}`);
  const ai = await reply.json();
  const answer = ai.choices?.[0]?.message?.content?.trim();
  return res.send(answer || "🧠 CrimznBot: no clean read — trade the levels and wait for confirmation.");

} catch (err) {
  console.error("❌ CrimznBot error:", err.message);

  // ---------- Tone-preserving fallback with spot prices ----------
  try {
    const ids = "bitcoin,ethereum,solana";
    const co = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const px = await co.json();
    const btc = px.bitcoin?.usd, eth = px.ethereum?.usd, sol = px.solana?.usd;

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const openers = ["High-level take:", "Here’s the clean read:", "Clarity first:"];
    const stances = [
      "Cycle still favors patient accumulation on quality while liquidity rotates.",
      "Momentum remains path-dependent; respect key inflection levels and let the tape confirm.",
      "Macro liquidity and tech adoption remain the north star; avoid emotional rotation."
    ];
    const plays = [
      "Define invalidation, size sanely, and let trend do the heavy lifting.",
      "Focus on asymmetric entries; don’t chase strength into resistance.",
      "Trim into euphoria, buy fear with a plan, and keep dry powder."
    ];

    const priceLine =
      (btc && eth && sol)
        ? `Spot check — BTC ~$${btc.toLocaleString()}, ETH ~$${eth.toLocaleString()}, SOL ~$${sol.toLocaleString()}. `
        : "";

    return res.send(
      `🧠 CrimznBot (fallback — tone preserved): ${priceLine}${pick(openers)} ${pick(stances)} ${pick(plays)}`
    );
  } catch {
    return res.send("🧠 CrimznBot (fallback): Keep risk tight, trade the levels, and let liquidity tell the story.");
  }
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

// Wildcard route to serve frontend for unmatched paths
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server — must be last!
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
  console.log("🤖 CrimznBot + PulseIt + SaveProfile + Firebase booted ✅");
  console.log("⚡ Built by Crimzn, powered by Solana + Helius");
});
