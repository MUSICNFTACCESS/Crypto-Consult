// ✅ Full Working script.js — Jun 27 Final Fix

async function fetchPrice(symbol, elementId) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    const data = await res.json();
    const price = data[symbol]?.usd ?? "N/A";
    document.getElementById(elementId).innerText = `$${price.toLocaleString()}`;
  } catch (error) {
    console.error("Price fetch error for", symbol, error);
    document.getElementById(elementId).innerText = "Error";
  }
}

window.onload = () => {
  fetchPrice("bitcoin", "btc-price");
  fetchPrice("ethereum", "eth-price");
  fetchPrice("solana", "sol-price");
};

// 🧠 CrimznBot placeholder (non-blocking if backend fails)
document.querySelector("form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  input.value = "";
  if (!message) return;

  const chatBox = document.getElementById("chat-box");
  const userMessage = document.createElement("div");
  userMessage.style.color = "#f7931a";
  userMessage.innerText = message;
  chatBox.appendChild(userMessage);

  try {
    const res = await fetch("https://crimznbot.onrender.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    const botMessage = document.createElement("div");
    botMessage.style.color = "limegreen";
    botMessage.innerText = data.reply ?? "No response.";
    chatBox.appendChild(botMessage);
  } catch (err) {
    const errorMsg = document.createElement("div");
    errorMsg.style.color = "red";
    errorMsg.innerText = "Bot unavailable.";
    chatBox.appendChild(errorMsg);
  }
});

// 🧠 PulseIt Analyzer
document.getElementById("pulseit-btn")?.addEventListener("click", () => {
  const input = document.getElementById("pulseit-input")?.value.toLowerCase();
  const result = document.getElementById("pulseit-result");
  if (!input) return (result.innerText = "❗ Please enter a topic.");

  const sentiment = input.includes("war") || input.includes("hacks") ? "Bearish"
                  : input.includes("etf") || input.includes("adoption") ? "Bullish"
                  : "Neutral";

  result.innerHTML = sentiment === "Bullish"
    ? "<span style='color: limegreen;'>📈 Bullish</span>"
    : sentiment === "Bearish"
    ? "<span style='color: red;'>📉 Bearish</span>"
    : "<span style='color: gold;'>⚖️ Neutral</span>";
});
