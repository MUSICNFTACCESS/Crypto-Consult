let questionCount = 0;
const questionLimit = 3;
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const paymentSection = document.getElementById("payment-options");

function appendMessage(message, sender = "user") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "bot-msg";
  msg.textContent = message;
  chatBox.innerHTML = ""; // Clear on each send
  chatBox.appendChild(msg);
}

async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").innerText = `$${data.bitcoin.usd}`;
    document.getElementById("eth-price").innerText = `$${data.ethereum.usd}`;
    document.getElementById("sol-price").innerText = `$${data.solana.usd}`;
  } catch (e) {
    console.error("Failed to fetch prices", e);
  }
}

sendButton.onclick = async () => {
  const input = userInput.value.trim();
  if (!input) return;
  appendMessage(input, "user");
  userInput.value = "";

  questionCount++;
  if (questionCount > questionLimit) {
    chatBox.innerHTML = "<p>You’ve reached your free limit.</p>";
    paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crimznbot.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await res.json();
    appendMessage(data.answer || "No response", "bot");
  } catch (e) {
    appendMessage("Error contacting CrimznBot.", "bot");
  }
};

fetchPrices();
