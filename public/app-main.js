// ✅ app-main.js — CrimznBot Full Logic + Wallet Connect + Disconnect

document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
    let maxFreeQuestions = 3;
    let hasPaid = localStorage.getItem("hasPaid") === "true";
    let connectedWallet = null;
    let paywallShown = false;

    const responseBox = document.getElementById("response-box");
    const connectBtn = document.getElementById("connectWalletBtn");
    const disconnectBtn = document.getElementById("disconnectWalletBtn");

    async function connectWallet() {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) {
        alert("🛑 Phantom Wallet not found. Please install it.");
        return;
      }
      try {
        const resp = await provider.connect();
        window.connectedWallet = resp.publicKey.toString();
        connectBtn.innerText = `✅ Connected: ${window.connectedWallet.slice(0, 4)}...${window.connectedWallet.slice(-4)}`;
        connectBtn.disabled = true;
        disconnectBtn.classList.remove("hidden");
        checkPaymentStatus();
      } catch (err) {
        console.error("❌ Wallet connection failed:", err);
        alert("⚠️ Wallet connection failed.");
      }
    }

    function disconnectWallet() {
      const provider = window?.phantom?.solana;
      if (provider?.isConnected) {
        provider.disconnect();
      }
      window.connectedWallet = null;
      localStorage.removeItem("hasPaid");
      connectBtn.innerText = "👛 Connect Wallet";
      connectBtn.disabled = false;
      disconnectBtn.classList.add("hidden");
      alert("🔌 Wallet disconnected.");
    }

    async function askCrimznBot() {
      const input = document.getElementById("prompt");
      const prompt = input.value.trim();
      if (!prompt) return;

      if (!hasPaid) {
        questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
        if (questionCount >= maxFreeQuestions) {
          if (!paywallShown) {
            const paywall = document.getElementById("paywall");
            if (paywall) {
              paywall.style.display = "block";
              paywallShown = true;
            }
          }
          return;
        }
        questionCount++;
        localStorage.setItem("questionCount", questionCount);
      }

      input.value = "";
      responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;

      try {
        const res = await fetch("/api/crimznbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, wallet: window.connectedWallet })
        });
        const data = await res.json();
        responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
      } catch (err) {
        responseBox.innerHTML = `<span class="response" style="color: red;">❌ Error getting response.</span>`;
      }
    }

    async function analyzePulseIt() {
      const input = document.getElementById("pulseit-input").value.trim();
      if (!input) return;

      const resultBox = document.getElementById("pulseit-result");
      resultBox.innerHTML = `🟡 Analyzing...`;

      try {
        const res = await fetch("/api/pulseit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input })
        });
        const data = await res.json();
        resultBox.innerHTML = `${data.emoji} ${data.sentiment.toUpperCase()} — ${data.explanation}`;
      } catch (err) {
        resultBox.innerHTML = `❌ Error analyzing.`;
      }
    }

    async function checkPaymentStatus() {
      if (!window.connectedWallet) return;
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: window.connectedWallet })
        });
        const data = await res.json();
        if (data.hasPaid) {
          document.getElementById("paywall").style.display = "none";
          paywallShown = false;
          hasPaid = true;
          localStorage.setItem("hasPaid", "true");
        }
      } catch (err) {
        console.error("❌ Payment check failed:", err);
      }
    }

    document.getElementById("send-btn").addEventListener("click", askCrimznBot);
    document.getElementById("analyze-btn").addEventListener("click", analyzePulseIt);
    connectBtn.addEventListener("click", connectWallet);
    disconnectBtn.addEventListener("click", disconnectWallet);

    if (hasPaid) {
      document.getElementById("paywall").style.display = "none";
    }

    document.getElementById("solana-pay-btn").addEventListener("click", () => {
      const address = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
      const url = `https://solana.com/pay?recipient=${address}&amount=0.025&reference=crimzn_consult&label=CryptoConsult&message=Unlock%20CrimznBot`;
      window.open(url, "_blank");
    });
  })();
});
