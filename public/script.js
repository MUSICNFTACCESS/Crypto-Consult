const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const pricesDiv = document.getElementById("prices");

let questionCount = 0;
const maxFreeQuestions = 3;

input.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const question = input.value.trim();
    if (!question) return;

    chatBox.innerHTML = `<div class="user">🧑 ${question}</div>`;
    input.value = "";

    if (questionCount >= maxFreeQuestions) {
      chatBox.innerHTML += `<div class="bot">⚠️ Free limit reached. Please pay to continue.</div>
      <a class="button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">Unlock for $99.99</a>`;
      return;
    }

    try {
      const res = await fetch("https://crimznbot.onrender.com/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
      questionCount++;
    } catch (err) {
      chatBox.innerHTML += `<div class="bot">❌ Error: ${err.message}</div>`;
    }
  }
});

async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    pricesDiv.innerText = `BTC: $${data.bitcoin.usd} | ETH: $${data.ethereum.usd} | SOL: $${data.solana.usd}`;
  } catch (err) {
    pricesDiv.innerText = "Price fetch error";
  }
}
fetchPrices();
setInterval(fetchPrices, 60000);
