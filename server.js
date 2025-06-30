app.post("/api/crimznbot", async (req, res) => {
  const question = (req.body.prompt || req.body.question || req.body.message || "").toLowerCase();
  if (!question) return res.status(400).json({ response: "No question provided." });

  const tokenMap = {
    btc: "bitcoin", bitcoin: "bitcoin", "btc-usd": "bitcoin",
    eth: "ethereum", ethereum: "ethereum", "eth-usd": "ethereum",
    sol: "solana", solana: "solana", "sol-usd": "solana",
    link: "chainlink", "chainlink": "chainlink",
    jup: "jupiter-exchange", jupiter: "jupiter-exchange",
    mstr: "microstrategy", microstrategy: "microstrategy",
    stx: "stacks", stacks: "stacks",
    py: "pyth-network", pyth: "pyth-network",
    ondo: "ondo-finance", "ondo-finance": "ondo-finance",
    ldo: "lido-dao", lido: "lido-dao",
    metaplanet: "metaplanet",
    arb: "arbitrum", arbitrum: "arbitrum",
    op: "optimism", optimism: "optimism",
    avax: "avalanche-2", avalanche: "avalanche-2",
    doge: "dogecoin", dogecoin: "dogecoin",
    pepe: "pepe", "pepe-coin": "pepe",
    bonk: "bonk", "bonk-token": "bonk"
  };

  const matchedToken = Object.keys(tokenMap).find(key => question.includes(key));
  const tokenId = matchedToken ? tokenMap[matchedToken] : null;

  if (tokenId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
      const priceRes = await fetch(url);
      const priceData = await priceRes.json();
      const usd = priceData[tokenId]?.usd;

      if (usd) {
        return res.json({
          response: `🟢 ${tokenId.toUpperCase()} is currently $${usd.toLocaleString()}.`
        });
      }
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ response: "💥 Error fetching price data." });
    }
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — a fast, accurate, and witty crypto strategist. Keep answers under 100 words. Prioritize data, humor, or edge.`
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const reply = chat.choices?.[0]?.message?.content || "🤖 CrimznBot is offline.";
    res.json({ response: reply });
  } catch (error) {
    console.error("CrimznBot error:", error.message);
    res.status(500).json({ response: "❌ CrimznBot failed to respond." });
  }
});
