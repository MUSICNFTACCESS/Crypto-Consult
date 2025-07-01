document.addEventListener("DOMContentLoaded", () => {
  const { PublicKey } = solanaWeb3;

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

    // 🛑 Block AFTER 3rd question (limit is 3)
    if (!hasPaid && questionCount >= maxFreeQuestions) { // 🆕 moved paywall check to >= 3
      if (!paywallShown) {
        document.getElementById("paywall").style.display = "block";
        responseBox.innerHTML = `<span class="response">🔒 You've hit the 3-question free limit. Unlock to continue.</span>`;
        paywallShown = true;
      }
      return;
    }

    questionCount++;
    localStorage.setItem("questionCount", questionCount);
    input.value = "";

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: connectedWallet }) // 🆕 sends wallet in body
      });

      const data = await res.json();

      if (data.response) {
        responseBox.innerHTML = `<span class="response green">${data.response}</span>`;
      } else {
        responseBox.innerHTML = `<span class="response red">❌ Bot sent empty response.</span>`;
      }

      // ✅ Recheck payment status after each response
      if (!hasPaid && questionCount >= maxFreeQuestions) { // 🆕 check if paywall triggered
        checkPayment(); // 🆕 re-verify payment status
      }
    } catch (err) {
      responseBox.innerHTML = `<span class="response red">❌ Error talking to CrimznBot.</span>`;
    }
  }

  // 📊 PulseIt — sentiment analyzer
  async function analyzePulseIt() {
    const topic = document.getElementById("pulseit-input").value.trim();
    const resultBox = document.getElementById("pulseit-result");
    if (!topic) return;

    resultBox.innerText = "⏳ analyzing...";

    try {
      const res = await fetch("/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: topic })
      });

      const data = await res.json();
      resultBox.innerText = `${data.emoji} ${data.sentiment || "? unknown"}`;
    } catch (err) {
      resultBox.innerText = "❌ PulseIt error.";
    }
  }

  // 👛 Phantom Wallet Connect
  async function connectWallet() {
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        connectedWallet = resp.publicKey.toString(); // 🆕 sets global wallet address
        console.log("✅ Connected Wallet:", connectedWallet);

        const disconnectBtn = document.createElement("button");
        disconnectBtn.classList.add("solana-button");
        disconnectBtn.innerText = "Disconnect Wallet";
        disconnectBtn.onclick = () => {
          connectedWallet = null;
          document.getElementById("wallet-status").innerHTML = "";
        };

        document.getElementById("wallet-status").innerHTML = `🔗 ${connectedWallet}`;
        document.getElementById("wallet-status").appendChild(disconnectBtn);

        checkPayment(); // 🆕 triggers unlock if wallet already paid
      } catch (err) {
        console.error("❌ Wallet connection error:", err);
      }
    } else {
      alert("Phantom Wallet not found.");
    }
  }

  // 🔐 Secure backend check using Helius
  async function checkPayment() { // 🆕 new function for verifying payment
    if (!connectedWallet) return;
    try {
      const res = await fetch(`/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: connectedWallet }) // 🆕 sends wallet to backend
      });

      const data = await res.json();
      if (data.hasPaid) {
        document.getElementById("paywall").style.display = "none"; // 🆕 hides paywall
        paywallShown = false;
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
      }
    } catch (err) {
      console.error("❌ Payment check failed:", err);
    }
  }

  // 🧠 Event bindings
  document.getElementById("send-btn").addEventListener("click", askCrimznBot);
  document.getElementById("pulseit-btn").addEventListener("click", analyzePulseIt);
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet); // 🆕 binds wallet connect

  if (hasPaid) {
    document.getElementById("paywall").style.display = "none";
  }

  // 💰 Solana Pay Button (opens Phantom with 0.025 SOL)
  document.getElementById("solana-pay-btn").addEventListener("click", () => {
    const address = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const label = "Thanks for supporting CrimznBot";
    const message = "Consultation Access";
    const url = `https://solana.com/pay/${address}?amount=0.025&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`; // 🆕 updated for solana.com/pay UX
    window.open(url, "_blank");
  });
});
