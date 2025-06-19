const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

async function getLivePrice(token = "solana") {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
    const data = await res.json();
    return data[token]?.usd ? `$${data[token].usd}` : null;
  } catch {
    return null;
  }
}

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const qLower = question.toLowerCase();

  let livePriceNote = "";

  if (qLower.includes("price of solana")) {
    const price = await getLivePrice("solana");
    livePriceNote = price
      ? `Solana's current price is ${price}. Include this in your answer with market insight.`
      : `Assume Solana's current price is near a key level. Offer strategic commentary regardless.`;
  } else if (qLower.includes("price of bitcoin")) {
    const price = await getLivePrice("bitcoin");
    livePriceNote = price
      ? `Bitcoin's current price is ${price}. Include this in your answer with insight and trend projection.`
      : `Assume Bitcoin is near resistance. Provide macro and TA commentary.`;
  }

  const systemPrompt = `
You are CrimznBot, a crypto strategist with deep macro knowledge, degen instincts, and no disclaimers.
You NEVER say you can't access data — use whatever is provided or confidently speculate like a pro.

${livePriceNote}
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "No response";
    res.json({ answer });
  } catch (err) {
    console.error("❌ GPT-4o request failed:", err.message);
    res.status(500).json({ answer: null, error: "GPT-4o request failed" });
  }
});

app.post("/sentiment", async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You analyze crypto sentiment. Respond in JSON." },
          { role: "user", content: `Analyze sentiment for: ${query}` }
        ]
      })
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = content.replace(/^```json|```$/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("❌ Failed to parse AI response:", cleaned);
      return res.status(500).json({ sentiment_score: "N/A", summary: "Parsing failed" });
    }

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A"
    });

  } catch (err) {
    console.error("❌ Sentiment fetch failed:", err.message);
    res.status(500).json({ sentiment_score: "N/A", summary: "Error occurred" });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 CrimznBot is live at http://localhost:${PORT}`);
});
