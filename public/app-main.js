// 📦 Crimzn Frontend Handler — app-main.js

document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;

  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const solanaUnlockBtn = document.getElementById("solanaUnlockBtn");
  const paywall = document.getElementById("paywall");
  const askCrimznBotBtn = document.getElementById("askCrimznBotBtn");
  const pulseitBtn = document.getElementById("pulseitBtn");
  const pulseitInput = document.getElementById("pulseitInput");
  const pulseitBox = document.getElementById("pulseitBox");

  if (!responseBox || !connectBtn || !disconnectBtn || !solanaPayBtn || !solanaUnlockBtn || !paywall || !askCrimznBotBtn || !pulseitInput || !pulseitBox) {
    console.error("❌ Missing DOM elements — aborting script execution.");
    return;
  }

  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) throw new Error("Phantom not detected.");
      const res = await provider.connect();
      connectedWallet = res.publicKey.toString();
      window.connectedWallet = connectedWallet;

      document.getElementById("wallet-status").innerHTML =
        `🟢 Connected: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
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
    document.getElementById("wallet-status").innerHTML = "🔴 Wallet disconnected.";
    disconnectBtn.classList.add("hidden");
  }

  askCrimznBotBtn.addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) return;

    if (!hasPaid && questionCount >= 3) {
      paywall.style.display = "block";
      paywall.scrollIntoView({ behavior: "smooth" });
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

  connectBtn.addEventListener("click", connectWallet);
  disconnectBtn.addEventListener("click", disconnectWallet);

  solanaPayBtn.addEventListener("click", () => {
    const recipient = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const amount = 0.025;
    const url = new URL("solana:" + recipient);
    url.searchParams.set("amount", amount.toString());
    url.searchParams.set("label", "Crimzn Consultation");
    url.searchParams.set("message", "Unlock CrimznBot");
    window.location.href = url.toString();
  });

  solanaUnlockBtn.addEventListener("click", () => {
    localStorage.setItem("hasPaid", "true");
    hasPaid = true;
    paywall.style.display = "none";
    alert("✅ Paywall manually unlocked.");
  });
});
