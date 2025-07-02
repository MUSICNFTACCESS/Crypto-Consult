// 🧠 app-main.js — CrimznBot + Wallet Connect + Payment Status + Solana Pay
document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let maxFreeQuestions = 3;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let paywallShown = false;

  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");

  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) {
        alert("🧩 Phantom not detected. Please install it.");
        return;
      }

      const resp = await provider.connect();
      const wallet = resp.publicKey.toString();

      document.getElementById("wallet-status").innerHTML = `🔓 Connected: ${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
      connectBtn.classList.add("hidden"); // 🔒 Hide connect
      disconnectBtn.classList.remove("hidden"); // ✅ Show disconnect
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  function disconnectWallet() {
    window.connectedWallet = null;
    document.getElementById("wallet-status").innerHTML = "";
    connectBtn.classList.remove("hidden"); // 🔓 Show connect
    disconnectBtn.classList.add("hidden"); // ❌ Hide disconnect
  }

  async function askCrimznBot() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();
    if (!prompt) return;

    questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
    if (!hasPaid && questionCount >= maxFreeQuestions) {
      const paywall = document.getElementById("paywall");
      responseBox.innerHTML = "";
      paywall.style.display = "block"; // 🧱 Show paywall
      paywall.scrollIntoView({ behavior: "smooth" }); // 📜 Scroll to paywall
      paywallShown = true;
      return;
    }

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;
    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });
      const data = await res.json();

      if (data.response.includes("🟢") && !hasPaid) {
        questionCount = maxFreeQuestions;
        const paywall = document.getElementById("paywall");
        if (paywall) {
          paywall.style.display = "block";
          paywall.scrollIntoView({ behavior: "smooth" });
        }
        paywallShown = true;
      }

      localStorage.setItem("questionCount", questionCount);
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      responseBox.innerHTML = `<span class="response" style="color: red;">❌ Error getting response...</span>`;
      console.error("❌ CrimznBot error:", err);
    }
  }

  // 📊 PulseIt Analyzer
  async function analyzePulseIt() {
    const input = document.getElementById("pulseit-input").value.trim();
    const resultBox = document.getElementById("pulseit-result");

    try {
      const res = await fetch("/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      resultBox.innerHTML = `${data.sentiment.toUpperCase()} → ${data.explanation}`;
    } catch (err) {
      resultBox.innerHTML = "❌ Error analyzing.";
      console.error("❌ PulseIt error:", err);
    }
  }

  // 🔄 Payment Status via Helius
  async function checkPaymentStatus() {
    if (!window.connectedWallet) return;
    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.hasPaid) {
        const paywall = document.getElementById("paywall");
        if (paywall) paywall.style.display = "none";
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
      }
    } catch (err) {
      console.error("❌ Payment check failed:", err);
    }
  }

  // 🔘 Main Button Listeners
  document.getElementById("send-btn").addEventListener("click", async () => {
    if (window.connectedWallet && !hasPaid) {
      await checkPaymentStatus();
    }
    await askCrimznBot();
  });

  document.getElementById("analyze-btn").addEventListener("click", analyzePulseIt);
  connectBtn.addEventListener("click", connectWallet);
  disconnectBtn.addEventListener("click", disconnectWallet);

  if (hasPaid) {
    document.getElementById("paywall").style.display = "none";
  }

  // 🔁 Solana Pay Button + QR Fallback
  document.getElementById("solana-pay-btn").addEventListener("click", () => {
    const address = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const solanaURL = `https://pay.helius.xyz/?recipient=${address}&amount=0.025&reference=crimz_consult&label=CryptoConsult&message=Unlock%20CrimznBot`;

    if (typeof QRCode === "undefined") return;

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      const qrBox = document.getElementById("qr-fallback");
      new QRCode(qrBox, {
        text: solanaURL,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      qrBox.style.display = "block";
    } else {
      window.location.href = solanaURL;
    }
  });
});
