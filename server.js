const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';

async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    return data[token]?.usd || 'N/A';
  } catch {
    return 'N/A';
  }
}

app.post('/api/message', async (req, res) => {
  const msg = req.body.message.toLowerCase();
  let response = "🤖 I’m not sure how to help with that yet.";
  if (msg.includes('price')) {
    if (msg.includes('btc')) {
      const price = await getPrice('bitcoin');
      response = `🧠 Bitcoin (BTC) is $${price}`;
    } else if (msg.includes('eth')) {
      const price = await getPrice('ethereum');
      response = `🧠 Ethereum (ETH) is $${price}`;
    } else if (msg.includes('sol')) {
      const price = await getPrice('solana');
      response = `🧠 Solana (SOL) is $${price}`;
    }
  }
  res.json({ response });
});

app.listen(PORT, () => {
  console.log(`CrimznBot running on port ${PORT}`);
});
