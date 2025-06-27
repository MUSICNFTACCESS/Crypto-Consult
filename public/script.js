// ✅ DOM Ready Wrapper
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Live Prices
  fetchPrice("bitcoin", "btc-price");
  fetchPrice("ethereum", "eth-price");
  fetchPrice("solana", "sol-price");

  // ✅ CrimznBot Chat
  const submitBtn = document.getElementById("submit-btn");
  const userInput = document.getElementById("user-input");
  const chat = document.getElementById("chat-box");

  if (submitBtn && userInput && chat) {
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const msg = userInput.value.trim();
      if (!msg) return;

      chat.innerHTML = `<div style="color: orange;">You: ${msg}</div>`;
      userInput.value = "";

      try {
        const res = await fetch("https://crypto-consult.onrender.com/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
        const data = await res.json();
        chat.innerHTML += `<div style="color: lightgreen;">CrimznBot: ${data.response}</div>`;
      } catch (err) {
        chat.innerHTML += `<div style="color:red;">Error: ${err.message || "No response."}</div>`;
      }
    });
  }

  // ✅ PulseIt Analyzer
  const pulseitBtn = document.getElementById("pulseit-btn");
  const pulseitInput = document.getElementById("pulseit-input");
  const pulseitResult = document.getElementById("pulseit-result");

  if (pulseitBtn && pulseitInput && pulseitResult) {
    pulseitBtn.addEventListener("click", () => {
      const input = pulseitInput.value.toLowerCase().trim();

      if (!input) {
        pulseitResult.innerText = "❗ Please enter a topic.";
        return;
      }

      const sentiment =
        input.includes("war") || input.includes("hacks")
          ? "Bearish"
          : input.includes("etf") || input.includes("adoption") || input.includes("trump")
          ? "Bullish"
          : "Neutral";

      pulseitResult.innerHTML =
        sentiment === "Bullish"
          ? "<span style='color: lightgreen;'>📈 Bullish</span>"
          : sentiment === "Bearish"
          ? "<span style='color: red;'>📉 Bearish</span>"
          : "<span style='color: gold;'>🟡 Neutral</span>";
    });
  }
});

// ✅ Price Fetching Utility
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
