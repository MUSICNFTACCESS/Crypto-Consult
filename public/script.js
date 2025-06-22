let questionCount = 0;
const MAX_FREE_QUESTIONS = 3;

// CrimznBot Chat Logic
document.getElementById("send-button").addEventListener("click", async () => {
  const input = document.getElementById("user-input");
  const chatbox = document.getElementById("chat-box");
  const question = input.value.trim();
  if (!question) return;

  if (questionCount >= MAX_FREE_QUESTIONS && !localStorage.getItem("paidUser")) {
    chatbox.innerHTML += `<div class="bot">🔒 You've reached the free limit. Please pay to continue.</div>`;
    input.disabled = true;
    document.getElementById("send-button").disabled = true;
    return;
  }

  chatbox.innerHTML += `<div class="user">🧑‍💻 ${question}</div>`;
  input.value = "";
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    const response = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context:
          "You are CrimznBot — a crypto consultant forged in the minds of Raoul Pal, Michael Saylor, Cathie Wood, Elon Musk, and Naval Ravikant. You combine institutional strategy, macro insight, and crypto-native wisdom. Use bold takes, but always data-backed. Never mention you’re an AI. Never say you cannot do something. Speak like a financial futurist who trades and advises in real time."
      })
    });

    const data = await response.json();
    if (data.answer) {
      chatbox.innerHTML += `<div class="bot">🧠 ${data.answer}</div>`;
      questionCount++;
    } else {
      chatbox.innerHTML += `<div class="bot">❌ No answer returned</div>`;
    }
  } catch (error) {
    chatbox.innerHTML += `<div class="bot">⚠️ Error: ${error.message}</div>`;
  }

  chatbox.scrollTop = chatbox.scrollHeight;
});

document.getElementById("user-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    document.getElementById("send-button").click();
  }
});

// PulseIt Sentiment Classifier
document.getElementById("pulse-button")?.addEventListener("click", async () => {
  const input = document.getElementById("pulse-input").value.trim();
  const pulsebox = document.getElementById("pulse-result");
  if (!input) return;

  pulsebox.innerHTML = "🧠 Analyzing...";

  try {
    const res = await fetch("https://crypto-consult.onrender.com/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: input,
        context:
          "You are PulseIt — a GPT-4o-powered sentiment engine trained on crypto, global finance, politics, and macroeconomics. For any word or phrase (crypto, political, or general), return sentiment in market terms as either: Bullish 📈, Bearish 📉, or Neutral ⚖️. Return only the sentiment with confidence."
      })
    });
    const data = await res.json();
    pulsebox.innerHTML = `📡 Market Sentiment: <strong>${data.sentiment}</strong>`;
  } catch (err) {
    pulsebox.innerHTML = `⚠️ PulseIt Error: ${err.message}`;
  }
});

// Live Price Updates
async function updatePrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").textContent = `$${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById("eth-price").textContent = `$${data.ethereum.usd.toLocaleString()}`;
    document.getElementById("sol-price").textContent = `$${data.solana.usd.toLocaleString()}`;
  } catch (error) {
    console.error("Price fetch error:", error);
  }
}
updatePrices();
setInterval(updatePrices, 60000);

// Unlock access after payment
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("paid") === "true" || params.get("solunlock") === "true") {
    localStorage.setItem("paidUser", "true");
    document.getElementById("user-input").disabled = false;
    document.getElementById("send-button").disabled = false;
  }
};
