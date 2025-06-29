const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");
const openai = new OpenAI();

// 🧠 CrimznBot (crypto advisor tone)
app.post("/api/ask", async (req, res) => {
  const question = req.body.question || req.body.message;
  if (!question) {
    return res.status(400).json({ response: "No question provided." });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are CrimznBot — a crypto-native AI trained in the styles of Raoul Pal, Michael Saylor, and Tom Crown.
Speak like a high-conviction visionary. Be educational, bold, strategic, and degen-friendly.
You are helping users of CryptoConsult understand markets, blockchain, DeFi, and crypto investing.
Always answer clearly, with conviction, and include real insights in your tone.
          `.trim()
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const response = chatCompletion.choices?.[0]?.message?.content || "CrimznBot is unsure how to answer.";
    res.json({ response });
  } catch (error) {
    console.error("CrimznBot error:", error.message);
    res.status(500).json({ response: "⚠️ CrimznBot backend error." });
  }
});

// 📣 PulseIt (sentiment analysis tool)
app.post("/pulseit", async (req, res) => {
  const topic = req.body.topic;
  if (!topic) {
    return res.status(400).json({ sentiment: "Neutral 🟡", explanation: "No topic provided." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are PulseIt — a fast crypto sentiment and news signaler.
Reply with a sentiment label (Bullish 🟢, Bearish 🔴, or Neutral 🟡) and a one-line explanation.
Make it quick, punchy, and emoji-coded.
          `.trim()
        },
        {
          role: "user",
          content: `Analyze the sentiment of: ${topic}`
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "Neutral 🟡 — No strong signal detected.";
    const [sentimentLine, ...rest] = text.split("\n");
    const sentiment = sentimentLine.trim();
    const explanation = rest.join(" ").trim() || "No explanation provided.";

    res.json({ sentiment, explanation });
  } catch (error) {
    console.error("PulseIt error:", error.message);
    res.status(500).json({
      sentiment: "Offline",
      explanation: "PulseIt backend error."
    });
  }
});

// 📈 Live price API for frontend polling
app.get("/api/prices", async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Price API error:", error.message);
    res.status(500).json({ error: "Failed to fetch live prices." });
  }
});

// 🌐 Start server
const PORT = process.env.PORT || 3000;
// Serve renamed HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.listen(PORT, () => {
  console.log(`CryptoConsult backend running on port ${PORT}`);
});
// force update


app.get('/', (req, res) => res.sendFile(__dirname + '/public/home.html'));
