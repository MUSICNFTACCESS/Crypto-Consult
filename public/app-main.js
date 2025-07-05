// 🧠 Crimzn Frontend Handler — app-main.js

document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;

  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const paywall = document.getElementById("paywall");
  const askCrimznBotBtn = document.getElementById("askCrimznBotBtn");
  const pulseitBtn = document.getElementById("pulseitBtn");
  const pulseitInput = document.getElementById("pulseitInput");
  const pulseitBox = document.getElementById("pulseitBox");
  const walletStatus = document.getElementById("wallet-status");

  if (
    !responseBox || !connectBtn || !disconnectBtn || !solanaPayBtn ||
    !paywall || !askCrimznBotBtn || !pulseitInput ||
    !pulseitBox || !walletStatus
  ) {
    console.error("❌ Missing DOM elements — aborting script execution.");
    return;
  }

  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) {
        alert("❌ Phantom Wallet not detected. Please install Phantom to continue.");
        return;
      }
      const res = await provider.connect();
      connectedWallet = res.publicKey.toString();
      window.connectedWallet = connectedWallet;

      walletStatus.innerHTML = `🟢 Connected: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
      disconnectBtn.classList.remove("hidden");
      await checkPaymentStatus();
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  async function disconnectWallet() {
    connectedWallet = null;
    window.connectedWallet = null;
    localStorage.removeItem("questionCount");
    localStorage.removeItem("hasPaid");
    hasPaid = false;
    walletStatus.innerHTML = "🔴 Wallet disconnected.";
    disconnectBtn.classList.add("hidden");
  }

  askCrimznBotBtn.addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) return;

    if (!hasPaid && questionCount >= 3) {
      if (paywall.style.display !== "block") {
        paywall.style.display = "block";
        paywall.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    responseBox.innerHTML = "<span class='response'>🟡 Thinking...</span>";
    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });

      const data = await res.json();
      if (data.response.includes("question limit")) {
        paywall.style.display = "block";
      }

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      responseBox.innerHTML = `<span class="response" style="color: red;">❌ Bot error. Try again.</span>`;
      console.error("❌ CrimznBot error:", err);
    }
  });

  async function checkPaymentStatus() {
    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.paid) {
        localStorage.setItem("hasPaid", "true");
        hasPaid = true;
        console.log("✅ User has paid. Unlocking...");
      }
    } catch (err) {
      console.error("❌ Payment status check failed:", err);
    }
  }

  pulseitBtn.addEventListener("click", async () => {
    const topic = pulseitInput.value.trim();
    if (!topic) return;
    pulseitBox.innerHTML = "🔎 Analyzing...";
    try {
      const res = await fetch("/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      pulseitBox.innerHTML = `🧠 ${data.response}`;
    } catch (err) {
      pulseitBox.innerHTML = "❌ Error analyzing sentiment.";
      console.error("❌ PulseIt error:", err);
    }
  });

  solanaPayBtn.addEventListener("click", () => {
    const recipient = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const amount = 0.025;
    const url = new URL("solana:" + recipient);
    url.searchParams.set("amount", amount.toString());
    url.searchParams.set("label", "Crimzn Consultation");
    url.searchParams.set("message", "Unlock CrimznBot");
    window.location.href = url.toString();
  });

  connectBtn.addEventListener("click", connectWallet);
  disconnectBtn.addEventListener("click", disconnectWallet);
});
