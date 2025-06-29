const express = require("express");
const fetch = require("node-fetch");                               
const path = require("path");                                      
const app = express();                                             

app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");                              
const openai = new OpenAI();

app.post("/api/ask", async (req, res) => {
  const question = req.body.question || req.body.message; // 🔥 fix: accept both field names
  if (!question) return res.status(400).json({ response: "No question provided", pulse: "Neutral 🟡" });

  try {
    // CrimznBot response
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
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

    // PulseIt
    let pulse = "Neutral 🟡";
    if (/etf|adoption|bullish|bitcoin|trump/i.test(question)) {
      pulse = "Bullish 🟢";
    } else if (/war|inflation|layoffs|scam|hacked|dump/i.test(question)) {
      pulse = "Bearish 🔴";
    }

    res.json({ response, pulse });
  } catch (error) {
    console.error("CrimznBot error:", error.message);
    res.status(500).json({
      response: "⚠️ CrimznBot backend error.",
      pulse: "Offline"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CryptoConsult backend running on port ${PORT}`);
});
