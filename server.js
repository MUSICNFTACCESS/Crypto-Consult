const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");
const openai = new OpenAI();

app.post("/api/ask", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "No message provided" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.6,
    });

    const answer = completion.choices?.[0]?.message?.content || "No answer.";
    const pulsePrompt = `What is the crypto market sentiment of: "${userMessage}"? Respond with: Bullish 🟢, Bearish 🔴, or Neutral 🟡.`;

    const pulse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: pulsePrompt }],
      temperature: 0.3,
    });

    const pulseResult = pulse.choices?.[0]?.message?.content?.trim() || "Neutral 🟡";
    res.json({ response: answer, pulse: pulseResult });
  } catch (err) {
    console.error("CrimznBot Error:", err.message);
    res.status(500).json({ response: "CrimznBot failed. Try again later.", pulse: "Neutral 🟡" });
  }
});

app.post("/api/pulse", async (req, res) => {
  const phrase = req.body.headline;
  if (!phrase) return res.status(400).json({ error: "Phrase is required" });

  try {
    const prompt = `What is the crypto market sentiment of: "${phrase}"? Respond with: Bullish 🟢, Bearish 🔴, or Neutral 🟡.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const sentiment = completion.choices?.[0]?.message?.content?.trim() || "Neutral 🟡";
    res.json({ sentiment });
  } catch (err) {
    console.error("PulseIt Error:", err.message);
    res.status(500).json({ error: "PulseIt failed" });
  }
});

app.get("/api/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await response.json();
    res.json({ price: data });
  } catch (err) {
    console.error("Price API Error:", err.message);
    res.status(500).json({ error: "Price fetch failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot running on http://localhost:${PORT}`);
});
