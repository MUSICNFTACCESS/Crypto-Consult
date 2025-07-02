// 🔐 Required modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const BigNumber = require("bignumber.js");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const walletUsage = {};setTimeout(() => {
  for (let wallet in walletUsage) {
    walletUsage[wallet] = { count: 0, hasPaid: false };
  }
  console.log("🔁 Wallet usage reset on startup.");
}, 1000);

app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    return res.json({ response: "🟡 You've hit your 3-question limit. Please pay to continue." });
  }

  walletUsage[wallet].count++;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await aiRes.json();
    const output = data.choices?.[0]?.message?.content || "⚠️ No response.";
    res.json({ response: output });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ AI error." });
  }
});

// ✅ Payment check (placeholder logic)
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  const paid = walletUsage[wallet]?.hasPaid || false;
  res.json({ hasPaid: paid });
});

// ✅ Solana Pay Link generator
app.get("/api/solana-pay-link", async (req, res) => {
  try {
    const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
    const amount = new BigNumber(0.025);
    const reference = new PublicKey("8KLrB98zFz5Jc2g6CmLMTGPkVVWxF7rGbwTMBuQFcJQf");
    const label = "CryptoConsult";
    const message = "Unlock CrimznBot";

    const url = encodeURL({ recipient, amount, reference, label, message });
    res.json({ url: url.toString() });
  } catch (err) {
    console.error("Solana Pay link error:", err.message);
    res.status(500).json({ error: "Solana Pay generation failed." });
  }
});

// ✅ Launch server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
