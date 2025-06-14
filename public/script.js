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
  userDiv.textContent = "You: " + userMessage;
  chatLog.appendChild(userDiv);

  input.value = "";
  messageCount++;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();

    const botDiv = document.createElement("div");
    botDiv.className = "bot";
    botDiv.textContent = "CrimznBot: " + (data.reply || "Sorry, no response.");
    chatLog.appendChild(botDiv);
  } catch (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "bot";
    errorDiv.textContent = "CrimznBot: ⚠️ Error processing your request.";
    chatLog.appendChild(errorDiv);
  }

  chatLog.scrollTop = chatLog.scrollHeight;
}

// Price fetch logic
async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    document.getElementById("btc-price").textContent = data.btc.toLocaleString();
    document.getElementById("eth-price").textContent = data.eth.toLocaleString();
    document.getElementById("sol-price").textContent = data.sol.toLocaleString();
  } catch (e) {
    console.error("Failed to fetch prices", e);
  }
}

fetchPrices();
setInterval(fetchPrices, 60000);

// 🔄 Load default BTC sentiment
async function loadBTCSentiment() {
  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=5&category=crypto");
    const news = await res.json();
    const btcNews = news.news.filter(n => n.title.toLowerCase().includes("bitcoin") || n.description.toLowerCase().includes("bitcoin"));

    let score = 0;
    btcNews.forEach(n => {
      if (n.title.toLowerCase().includes("up") || n.title.toLowerCase().includes("bullish")) score++;
      if (n.title.toLowerCase().includes("down") || n.title.toLowerCase().includes("bearish")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    document.getElementById("sentiment-score").innerText = sentiment;
  } catch (e) {
    document.getElementById("sentiment-score").innerText = "Error fetching sentiment";
  }
}

// 🧠 Custom Sentiment Search
async function searchSentiment() {
  const query = document.getElementById("sentiment-query").value.toLowerCase();
  const resultEl = document.getElementById("sentiment-result");

  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=10&category=crypto");
    const news = await res.json();
    const relevant = news.news.filter(n => n.title.toLowerCase().includes(query) || n.description.toLowerCase().includes(query));

    let score = 0;
    relevant.forEach(n => {
      if (n.title.toLowerCase().includes("up") || n.title.toLowerCase().includes("bullish")) score++;
      if (n.title.toLowerCase().includes("down") || n.title.toLowerCase().includes("bearish")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    resultEl.innerText = `Sentiment for "${query}": ${sentiment}`;
  } catch (e) {
    resultEl.innerText = "Error fetching sentiment.";
  }
}

// 🔁 Auto-load BTC sentiment on page load
loadBTCSentiment();
