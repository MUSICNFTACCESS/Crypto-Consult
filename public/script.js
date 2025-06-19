const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendButton = document.getElementById("send-button");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");
const btcPrice = document.getElementById("btc-price");
const ethPrice = document.getElementById("eth-price");
const solPrice = document.getElementById("sol-price");
const paymentSection = document.getElementById("payment-options");

let questionCount = 0;
const maxFreeQuestions = 3;

async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🙋🏽‍♂️ ${question}</div>`;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    chatBox.innerHTML += `
      <div class="bot">⚠️ Free limit reached. Please 
      <a class="button" href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b" target="_blank">💰 Tip 1 USDC</a> 
      or <a class="button" href="https://t.me/CrimznBot" target="_blank">📬 Contact Crimzn</a></div>`;
    if (paymentSection) paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
    questionCount++;
  } catch {
    chatBox.innerHTML += `<div class="bot">❌ Error fetching CrimznBot response</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.onclick = () => {
  const question = input.value.trim();
  if (question) handleCrimznBot(question);
};

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = input.value.trim();
    if (question) handleCrimznBot(question);
  }
});

// 🧠 Alpha Pulse Tracker
async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) {
    sentimentResult.innerText = "❌ Enter a term.";
    return;
  }

  sentimentResult.innerText = `🔍 Analyzing sentiment for "${query}"...`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    sentimentResult.innerText = `📊 Sentiment for "${query}": ${data.summary || "Neutral"} (${data.sentiment_score || "N/A"})`;
  } catch {
    sentimentResult.innerText = "❌ Error analyzing sentiment.";
  }
}

// 📈 Live Price Fetcher
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    btcPrice.textContent = "$" + data.bitcoin.usd.toLocaleString();
    ethPrice.textContent = "$" + data.ethereum.usd.toLocaleString();
    solPrice.textContent = "$" + data.solana.usd.toLocaleString();
  } catch {
    btcPrice.textContent = "$Error";
    ethPrice.textContent = "$Error";
    solPrice.textContent = "$Error";
  }
}

// Load prices and wallet buttons
document.addEventListener("DOMContentLoaded", () => {
  fetchPrices();
  setInterval(fetchPrices, 60000);
});
