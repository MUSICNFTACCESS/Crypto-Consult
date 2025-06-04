const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: userMessage }],
    });

    const botReply = response.data.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.json({ reply: "Sorry, I couldn’t process that. Please try again later." });
  }
});

app.get("/prices", async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
    const response = await fetch(url);
    const data = await response.json();
    res.json({
      btc: data.bitcoin.usd,
      eth: data.ethereum.usd,
      sol: data.solana.usd,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot running at http://localhost:${PORT}`);
});
