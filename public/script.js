// ✅ CrimznBot Chat Logic
let messageCount = 0;

async function sendMessage(event) {
  event.preventDefault();

  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-log");
  const paymentOptions = document.getElementById("payment-options");

  if (messageCount >= 3) {
    paymentOptions.style.display = "block";
    input.disabled = true;
    return;
  }

  const userMessage = input.value.trim();
  if (!userMessage) return;

  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.textContent = "🧑‍🚀 You: " + userMessage;
  chatLog.appendChild(userDiv);

  input.value = "";
  messageCount++;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();

    const botDiv = document.createElement("div");
    botDiv.className = "bot";
    botDiv.textContent = "🤖 CrimznBot: " + (data.reply || "Sorry, no response.");
    chatLog.appendChild(botDiv);
  } catch (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "bot";
    errorDiv.textContent = "🤖 CrimznBot: ⚠️ Error processing your request.";
    chatLog.appendChild(errorDiv);
  }

  chatLog.scrollTop = chatLog.scrollHeight;
}

// ✅ Live Price Fetcher
async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    document.getElementById("btc-price").textContent = data.btc.toLocaleString("en-US", { style: "currency", currency: "USD" });
    document.getElementById("eth-price").textContent = data.eth.toLocaleString("en-US", { style: "currency", currency: "USD" });
    document.getElementById("sol-price").textContent = data.sol.toLocaleString("en-US", { style: "currency", currency: "USD" });
  } catch (e) {
    console.error("Failed to fetch prices", e);
  }
}
fetchPrices();
setInterval(fetchPrices, 60000);

// ✅ BTC News Sentiment on Load
async function loadBTCSentiment() {
  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=20");
    const news = await res.json();
    const btcNews = news.news.filter(n => n.title.toLowerCase().includes("bitcoin"));

    let score = 0;
    btcNews.forEach(n => {
      const t = n.title.toLowerCase();
      if (t.includes("up") || t.includes("gain")) score++;
      if (t.includes("down") || t.includes("drop")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    const resultEl = document.getElementById("sentiment-result");
    if (resultEl) resultEl.innerText = `BTC Sentiment: ${sentiment}`;
  } catch (e) {
    const resultEl = document.getElementById("sentiment-result");
    if (resultEl) resultEl.innerText = "Error fetching sentiment.";
  }
}
loadBTCSentiment();

// ✅ Custom Sentiment Search
async function searchSentiment() {
  const query = document.getElementById("sentiment-query").value.toLowerCase();
  const resultEl = document.getElementById("sentiment-result");

  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=20");
    const news = await res.json();
    const relevant = news.news.filter(n => n.title.toLowerCase().includes(query));

    let score = 0;
    relevant.forEach(n => {
      const t = n.title.toLowerCase();
      if (t.includes("up") || t.includes("gain")) score++;
      if (t.includes("down") || t.includes("drop")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    resultEl.innerText = `Sentiment for "${query}": ${sentiment}`;
  } catch (e) {
    resultEl.innerText = "Error fetching sentiment.";
  }
}

// ✅ Pulse It Button Handler
const pulseButton = document.getElementById("pulse-it");
if (pulseButton) {
  pulseButton.addEventListener("click", searchSentiment);
}

// ✅ Back to CryptoConsult button for sentiment page
window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("sentiment")) {
    const backBtn = document.createElement("a");
    backBtn.href = "/";
    backBtn.textContent = "⬅️ Back to CryptoConsult";
    backBtn.style = "display:block;margin:1rem;font-family:'Courier New', monospace;text-decoration:none;color:#f7931a;";
    document.body.insertBefore(backBtn, document.body.firstChild);
  }
});
