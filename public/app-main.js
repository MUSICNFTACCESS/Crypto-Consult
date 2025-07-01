document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  const maxFreeQuestions = 3;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;
  let paywallShown = false;

  const responseBox = document.getElementById("response-box");

  // 🤖 CrimznBot
  async function askCrimznBot() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();
    if (!prompt) return;

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;
    input.value = "";

    try {
      const res = await fetch("https://crypto-consult.onrender.com/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data?.response) {
        responseBox.innerHTML = `<span class="response green">${data.response}</span>`;

        if (!hasPaid) {
          questionCount++;
          localStorage.setItem("questionCount", questionCount);

          if (questionCount >= maxFreeQuestions) {
            document.getElementById("paywall").style.display = "block";
            paywallShown = true;
          }
        }
      } else {
        responseBox.innerHTML = `<span class="response">❌ Bot sent empty response.</span>`;
        console.warn("Empty or bad response:", data);
      }
    } catch (err) {
      responseBox.innerHTML = `<span class="response">❌ Error talking to CrimznBot.</span>`;
      console.error("Bot error:", err);
    }
  }

  // 📈 PulseIt
  async function analyzePulseIt() {
    const topic = document.getElementById("pulseit-input").value.trim();
    const resultBox = document.getElementById("pulseit-result");
    if (!topic) return;

    resultBox.innerText = "🔄 analyzing...";
    try {
      const res = await fetch("https://crypto-consult.onrender.com/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: topic }),
      });
      const data = await res.json();
      resultBox.innerText = data.sentiment || "❓ unknown";
    } catch (e) {
      resultBox.innerText = "❌ error";
      console.error("PulseIt error:", e);
    }
  }

  // 🔌 Phantom Wallet
  async function connectWallet() {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom Wallet not found.");
      return;
    }

    try {
      const resp = await window.solana.connect();
      connectedWallet = resp.publicKey.toString();

      const btn = document.getElementById("connectWalletBtn");
      btn.textContent = connectedWallet;
      btn.style.display = "none";

      const disconnectBtn = document.createElement("button");
      disconnectBtn.id = "disconnect-wallet";
      disconnectBtn.className = "solana-button";
      disconnectBtn.textContent = "Disconnect Wallet";
      disconnectBtn.onclick = () => {
        connectedWallet = null;
        window.solana.disconnect();
        window.location.reload();
      };
      document.getElementById("wallet-status").appendChild(disconnectBtn);

      await checkPayment();
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  }

  // 💸 Check payment via Helius
  async function checkPayment() {
    const HELIUS_API_KEY = "REPLACE_WITH_STATIC_KEY";
    const HELIUS_TX_URL = "REPLACE_WITH_STATIC_URL";

    try {
      const res = await fetch(`${HELIUS_TX_URL}?api-key=${HELIUS_API_KEY}`);
      const data = await res.json();

      hasPaid = data?.transactions?.some(tx =>
        tx.account === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" &&
        tx.amount >= 0.025
      );

      if (hasPaid) {
        document.getElementById("paywall").style.display = "none";
        paywallShown = false;
        localStorage.setItem("hasPaid", "true");
      }
    } catch (err) {
      console.error("💸 Payment check failed:", err);
    }
  }

  // 🔘 Event bindings
  document.getElementById("send-btn")?.addEventListener("click", askCrimznBot);
  document.getElementById("analyze-btn")?.addEventListener("click", analyzePulseIt);
  document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);

  if (hasPaid) {
    document.getElementById("paywall").style.display = "none";
  }
});
