let questionCount = 0;
const MAX_FREE_QUESTIONS = 3;

// 🚀 CrimznBot Client Logic
document.getElementById("send-button").addEventListener("click", async () => {
  const input = document.getElementById("user-input");
  const chatbox = document.getElementById("chat-box");
  const question = input.value.trim();

  if (!question) return;

  if (questionCount >= MAX_FREE_QUESTIONS && !localStorage.getItem("paidUser")) {
    chatbox.innerHTML += "<div class='bot-msg'>🛑 You've reached the free limit. Please pay to continue.</div>";
    document.getElementById("user-input").disabled = true;
    document.getElementById("send-button").disabled = true;
    document.getElementById("paywall").classList.remove("hidden");
    return;
  }

  questionCount++;
  chatbox.innerHTML += `<div class='user-msg'>🟠 ${question}</div>`;
  input.value = "";
  chatbox.scrollHeight = chatbox.scrollHeight;

  try {
    const response = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    chatbox.innerHTML += `<div class='bot-msg'>🟢 CrimznBot: ${data.response}</div>`;
  } catch (err) {
    chatbox.innerHTML += `<div class='bot-msg'>❌ Error: ${err.message}</div>`;
  }

  chatbox.scrollHeight = chatbox.scrollHeight;
});

document.getElementById("user-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    document.getElementById("send-button").click();
  }
});

// 🔮 PulseIt Sentiment Classifier
document.getElementById("pulse-button").addEventListener("click", async () => {
  const input = document.getElementById("pulse-input");
  const pulsebox = document.getElementById("pulse-result");
  const query = input.value.trim();

  if (!query) return;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/pulseit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query }),
    });
    const data = await res.json();
    pulsebox.innerHTML = `🧠 Market Sentiment: <strong>${data.sentiment}</strong>`;
  } catch (err) {
    pulsebox.innerHTML = `⚠️ PulseIt Error: ${err.message}`;
  }
});

// 💵 Live Price Updates
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
setInterval(updatePrices, 60000);

// 🔓 Solana Unlock Check
window.onload = () => {
  updatePrices();
  const params = new URLSearchParams(window.location.search);
  if (params.get("solUnlock") === "true") {
    localStorage.setItem("paidUser", "true");
    document.getElementById("user-input").disabled = false;
    document.getElementById("send-button").disabled = false;
    document.getElementById("paywall").classList.add("hidden");
  }
};
