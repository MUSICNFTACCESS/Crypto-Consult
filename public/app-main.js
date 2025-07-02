document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";

  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");

  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) return alert("Phantom not detected. Please install it.");
      const res = await provider.connect();
      const wallet = res.publicKey.toString();
      window.connectedWallet = wallet;
      document.getElementById("wallet-status").innerHTML =
        `🔒 Connected: ${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
      connectBtn.style.display = "none";
      disconnectBtn.style.display = "inline-block";
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  function disconnectWallet() {
  window.connectedWallet = null;
  localStorage.setItem("hasPaid", "false"); // 🧠 Reset payment status
  document.getElementById("wallet-status").innerHTML = "";
  connectBtn.style.display = "inline-block";
  disconnectBtn.style.display = "none";
}

  async function askCrimznBot() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();
    if (!prompt) return;

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });
      const data = await res.json();

      if (data.response.includes("hit your 3-question limit")) {
        localStorage.setItem("hasPaid", "false");
        const paywall = document.getElementById("paywall");
        if (paywall) {
          paywall.style.display = "block";
          paywall.scrollIntoView({ behavior: "smooth" });
        }
      }

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      console.error("❌ CrimznBot error:", err);
      responseBox.innerHTML = `<span class="response" style="color: red;">❌ Error getting response.</span>`;
    }
  }

  async function checkPaymentStatus() {
    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.hasPaid) {
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
        document.getElementById("paywall").style.display = "none";
      }
    } catch (err) {
      console.error("❌ Payment check failed:", err);
    }
  }

  document.getElementById("send-btn").addEventListener("click", async () => {
    if (window.connectedWallet && !hasPaid) {
      await checkPaymentStatus();
    }
    await askCrimznBot();
  });

  connectBtn.addEventListener("click", connectWallet);
  disconnectBtn.addEventListener("click", disconnectWallet);

  // 🪙 Solana Pay Button + QR fallback
  document.getElementById("solana-pay-btn").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/solana-pay-link");
      const data = await res.json();
      const solanaURL = data.url;

      if (typeof QRCode === "undefined") return;

      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        const qrBox = document.getElementById("qr-fallback");
        qrBox.innerHTML = "";
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
    } catch (err) {
      console.error("❌ Solana Pay link error:", err);
    }
  });

  if (hasPaid) {
    document.getElementById("paywall").style.display = "none";
  }
});
