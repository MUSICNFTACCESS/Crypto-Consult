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
  chatBox.appendChild(msg);
}

async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    document.getElementById("btc-price").innerText = `$${data.btc.toLocaleString()}`;
    document.getElementById("eth-price").innerText = `$${data.eth.toLocaleString()}`;
    document.getElementById("sol-price").innerText = `$${data.sol.toLocaleString()}`;
  } catch (e) {
    console.error("Failed to fetch prices", e);
  }
}

sendButton.onclick = async () => {
  const input = userInput.value.trim();
  if (!input) return;

  chatBox.innerHTML = ""; // clear each message
  appendMessage(input, "user");
  userInput.value = "";

  if (questionCount >= questionLimit) {
    chatBox.innerHTML += `<p>🛑 You’ve hit your free limit. Please pay to continue:</p>`;
    paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    appendMessage(data.reply || "No reply.", "bot");
    questionCount++;
  } catch (err) {
    appendMessage("❌ CrimznBot error. Try again later.", "bot");
  }
};

fetchPrices();
