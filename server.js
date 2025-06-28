const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");
const openai = new OpenAI();

app.post("/api/ask", async (req, res) => {
  const question = req.body.question;
  if (!question) return res.status(400).json({ error: "No question provided." });

  try {
    // CrimznBot response
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are CrimznBot — a crypto-native AI trained in the styles of Raoul Pal, Michael Saylor, and Cathie Wood.
Speak like a high-conviction visionary. Be educational, bold, strategic, slightly degen, and never boring.
You are helping users of CryptoConsult understand markets, blockchain, and cycle tops.
Always answer clearly, with conviction, and include real insights where appropriate.
          `.trim(),
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.6,
    });

    const answer = chatCompletion.choices?.[0]?.message?.content || "No answer available.";

    // PulseIt response
    const pulsePrompt = `Give a one-word crypto sentiment (Bullish, Bearish, or Neutral) with a tone emoji for this input: "${question}". Respond only with something like "Bullish 🟩" or "Bearish 🟥" or "Neutral 🟨".`;

    const pulseCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: pulsePrompt,
        },
      ],
      temperature: 0.3,
    });

    const pulse = pulseCompletion.choices?.[0]?.message?.content?.trim() || "Neutral 🟨";

    res.json({ answer, pulse });
  } catch (err) {
    console.error("CrimznBot error:", err.message);
    res.status(500).json({ answer: "⚠️ CrimznBot failed. Try again later.", pulse: "Neutral 🟨" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CryptoConsult backend running on port ${PORT}`);
});
