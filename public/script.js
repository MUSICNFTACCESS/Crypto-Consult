let questionCount = 0;
const MAX_FREE_QUESTIONS = 3;

document.getElementById("send-button").addEventListener("click", async () => {
  const input = document.getElementById("user-input");
  const chatbox = document.getElementById("chat-box");
  const question = input.value.trim();
  if (!question) return;

  if (questionCount >= MAX_FREE_QUESTIONS && !localStorage.getItem("paidUser")) {
    chatbox.innerHTML += `<div class="bot">🔒 You’ve reached the free limit. Please pay or connect wallet to unlock.</div>`;
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
      body: JSON.stringify({ question })
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

async function updatePrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").textContent = `$${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById("eth-price").textContent = `$${data.ethereum.usd.toLocaleString()}`;
    document.getElementById("sol-price").textContent = `$${data.solana.usd.toLocaleString()}`;
  } catch (err) {
    console.error("Price fetch error:", err);
  }
}
updatePrices();
setInterval(updatePrices, 60000);

window.onload = () => {
  // Check if user already paid
  if (window.location.href.includes("paid=true")) {
    localStorage.setItem("paidUser", "true");
    document.getElementById("user-input").disabled = false;
    document.getElementById("send-button").disabled = false;
  }

  // Solana Pay fallback logic
  const params = new URLSearchParams(window.location.search);
  if (params.get("solunlock") === "true") {
    localStorage.setItem("paidUser", "true");
  }
};
