// 🧠 CrimznBot Chat Logic
let messageCount = 0;

document.getElementById("chat-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-log");
  const paymentOptions = document.getElementById("payment-options");

  const userText = input.value.trim();
  if (!userText) return;

  const userMsg = document.createElement("p");
  userMsg.className = "user";
  userMsg.innerText = `🧑‍🚀 You: ${userText}`;
  chatLog.appendChild(userMsg);

  input.value = "";

  const botMsg = document.createElement("p");
  botMsg.className = "bot";
  botMsg.innerText = "🤖 CrimznBot: ...thinking...";
  chatLog.appendChild(botMsg);

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await res.json();
    botMsg.innerText = `🤖 CrimznBot: ${data.reply || "No response."}`;
  } catch (e) {
    botMsg.innerText = "🤖 CrimznBot: ⚠️ Error fetching response.";
  }

  chatLog.scrollTop = chatLog.scrollHeight;

  messageCount++;
  if (messageCount >= 3) {
    paymentOptions.style.display = "block";
    input.disabled = true;
  }
});

// 📈 Price Fetch Logic
async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();

    document.getElementById("btc-price").textContent = data.btc.toLocaleString("en-US", { style: "currency", currency: "USD" });
    document.getElementById("eth-price").textContent = data.eth.toLocaleString("en-US", { style: "currency", currency: "USD" });
    document.getElementById("sol-price").textContent = data.sol.toLocaleString("en-US", { style: "currency", currency: "USD" });
  } catch (e) {
    console.error("Price fetch failed:", e);
  }
}
fetchPrices();
setInterval(fetchPrices, 60000);

// 🧠 Load Default BTC Sentiment
async function loadBTCSentiment() {
  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=20");
    const news = await res.json();
    const btcNews = news.news.filter(n => n.title.toLowerCase().includes("bitcoin"));

    let score = 0;
    btcNews.forEach(n => {
      const title = n.title.toLowerCase();
      if (title.includes("up") || title.includes("gain")) score++;
      if (title.includes("down") || title.includes("drop")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    document.getElementById("sentiment-score").innerText = sentiment;
  } catch (e) {
    document.getElementById("sentiment-score").innerText = "Error fetching sentiment.";
  }
}

// 🔍 Custom Sentiment Tracker
async function searchSentiment() {
  const query = document.getElementById("sentiment-query").value.toLowerCase();
  const resultEl = document.getElementById("sentiment-result");

  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=20");
    const news = await res.json();
    const matches = news.news.filter(n => n.title.toLowerCase().includes(query));

    let score = 0;
    matches.forEach(n => {
      const title = n.title.toLowerCase();
      if (title.includes("up") || title.includes("gain")) score++;
      if (title.includes("down") || title.includes("drop")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    resultEl.innerText = `Sentiment for "${query}": ${sentiment}`;
  } catch (e) {
    resultEl.innerText = "Error fetching sentiment.";
  }
}

// Auto-run BTC sentiment on page load
loadBTCSentiment();
