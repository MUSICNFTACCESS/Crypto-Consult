// ✅ Full working script.js – Jun 27 Final Fix

// 🔹 Price Fetcher
async function fetchPrice(symbol, elementId) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    const data = await res.json();
    const price = data[symbol].usd ?? "N/A";
    document.getElementById(elementId).innerText = `$${price.toLocaleString()}`;
  } catch (error) {
    console.error("Price fetch error for:", symbol, error);
    document.getElementById(elementId).innerText = "Error";
  }
}

window.onload = () => {
  fetchPrice("bitcoin", "btc-price");
  fetchPrice("ethereum", "eth-price");
  fetchPrice("solana", "sol-price");
};

// 🔹 CrimznBot placeholder (non-blocking if backend fails)
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("user-input");
  const userMsg = input.value.trim();
  if (!userMsg) return;

  const chat = document.getElementById("chat-box");
  chat.innerHTML = `<div style="color: orange;">You: ${userMsg}</div>`;
  input.value = "";

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    chat.innerHTML += `<div style="color: lightgreen;">CrimznBot: ${data.response}</div>`;
  } catch (err) {
    chat.innerHTML += `<div style="color:red;">Error: ${err.message || "No response."}</div>`;
  }
});

// 🔹 PulseIt Analyzer
document.getElementById("pulseit-btn").addEventListener("click", () => {
  const input = document.getElementById("pulseit-input").value.toLowerCase();
  const result = document.getElementById("pulseit-result");
  if (!input) return (result.innerText = "❗ Please enter a topic.");

  const sentiment =
    input.includes("war") || input.includes("hacks") ? "Bearish" :
    input.includes("etf") || input.includes("adoption") ? "Bullish" :
    "Neutral";

  result.innerHTML =
    sentiment === "Bullish"
      ? "<span style='color: lightgreen;'>📈 Bullish</span>"
      : sentiment === "Bearish"
      ? "<span style='color: red;'>📉 Bearish</span>"
      : "<span style='color: gold;'>🟡 Neutral</span>";
});
