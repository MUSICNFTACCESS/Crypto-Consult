// 📦 Crimzn Frontend Handler — app-main-live.js

document.addEventListener("DOMContentLoaded", () => {
  // 🧠 Local state from storage
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;

  // 🔗 DOM elements
  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const paywall = document.getElementById("paywall");
  const askCrimznBotBtn = document.getElementById("askCrimznBotBtn");
  const pulseitBtn = document.getElementById("pulseitBtn");
  const pulseitInput = document.getElementById("pulseitInput");
  const pulseitBox = document.getElementById("pulseitBox");

  // 🚨 Abort if any DOM element is missing
  if (!responseBox || !connectBtn || !disconnectBtn || !solanaPayBtn || !paywall || !askCrimznBotBtn || !pulseitBtn || !pulseitInput || !pulseitBox) {
    console.error("❌ Missing DOM elements — aborting script execution.");
    return;
  }

  // 👛 Connect Phantom Wallet
  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) throw new Error("Phantom not detected. Please install Phantom Wallet.");
      const res = await provider.connect();
      connectedWallet = res.publicKey.toString();
      window.connectedWallet = connectedWallet;
      document.getElementById("wallet-status").innerHTML =
        `🟢 Connected: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  // 🔌 Disconnect Wallet
  async function disconnectWallet() {
    connectedWallet = null;
    window.connectedWallet = null;
    localStorage.removeItem("questionCount");
    localStorage.removeItem("hasPaid");
    document.getElementById("wallet-status").innerHTML = "🔴 Wallet disconnected.";
  }

  // 🧠 Ask CrimznBot
  askCrimznBotBtn.addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) return;

    if (!hasPaid && questionCount >= 3) {
      paywall.style.display = "block";
      paywall.scrollIntoView({ behavior: "smooth" });
      return;
    }

    responseBox.innerHTML = '<span class="response">🟡 Thinking...</span>';

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });

      const data = await res.json();
      if (data.response.includes("3-question limit")) {
        paywall.style.display = "block";
        paywall.scrollIntoView({ behavior: "smooth" });
        return;
      }

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      responseBox.innerHTML = '<span class="response" style="color: red;">❌ Bot error. Try again.</span>';
      console.error("❌ CrimznBot error:", err);
    }
  });

  // 🔐 Check Payment from Backend (Helius integration)
  async function checkPaymentStatus() {
    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.hasPaid) {
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
        paywall.style.display = "none";
      }
    } catch (err) {
      console.error("❌ Payment status check failed:", err);
    }
  }

  // 📣 PulseIt Sentiment Analyzer
  pulseitBtn.addEventListener("click", async () => {
    const topic = pulseitInput.value.trim();
    if (!topic) return;
    pulseitBox.innerHTML = "⏳ Analyzing...";

    try {
      const res = await fetch("/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      pulseitBox.innerHTML = data.response;
    } catch (err) {
      pulseitBox.innerHTML = "❌ Error analyzing sentiment.";
      console.error("❌ PulseIt error:", err);
    }
  });

  // 🖱️ Wallet connect/disconnect
  connectBtn.addEventListener("click", async () => {
    await connectWallet();
    await checkPaymentStatus();
  });

  disconnectBtn.addEventListener("click", disconnectWallet);

  // 💸 Solana Pay — No QR fallback
  solanaPayBtn.addEventListener("click", async (e) => {
    try {
      e.preventDefault();
      const recipientAddress = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
      if (!recipientAddress) throw new Error("Recipient wallet is missing");

      const recipient = new solanaWeb3.PublicKey(recipientAddress);
      const amount = 0.025;
      const url = encodeURL({ recipient, amount, label: "Thanks for supporting Crimzn" });

      window.location.href = url.toString();
    } catch (err) {
      console.error("❌ Solana Pay error:", err);
      alert("Solana Pay error. Please try again.");
    }
  });
});
// 🔁 Force refresh Thu Jul  3 18:00:23 EDT 2025
