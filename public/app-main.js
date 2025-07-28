document.addEventListener("DOMContentLoaded", () => {
  // 🔢 Load question count and unlock state
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;

  // 🎯 DOM Elements
  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const askCrimznBtn = document.getElementById("askCrimznBtn");
  const pulseitBtn = document.getElementById("pulseitBtn");
  const pulseitInput = document.getElementById("pulseitInput");
  const pulseitBox = document.getElementById("pulseitBox");
  const walletStatus = document.getElementById("wallet-status");
  const promptInput = document.getElementById("prompt"); // ✅ FIX: Missing promptInput definition

  // ✅ FIX: Toggle wallet button visibility on page load
  if (window.connectedWallet || window.solana?.isConnected) {
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "inline-block";
  } else {
    connectBtn.style.display = "inline-block";
    disconnectBtn.style.display = "none";
  }

  // ❌ Exit if DOM not found
  if (
    !responseBox || !connectBtn || !disconnectBtn || !solanaPayBtn ||
    !saveProfileBtn || !askCrimznBtn || !pulseitBtn || !pulseitInput || !pulseitBox || !walletStatus || !promptInput
  ) {
    console.error("❌ Missing DOM elements — aborting script execution.");
    return;
  }

  // 🔒 Set initial button visibility
  if (hasPaid) {
    solanaPayBtn.style.display = "none";
  } else {
    solanaPayBtn.style.display = "inline-block";
    disconnectBtn.style.display = "none";
  }

  // 👂 Connect Button Listener
  connectBtn.addEventListener("click", connectWallet);

  // 👂 Disconnect Button Listener
  disconnectBtn.addEventListener("click", disconnectWallet);

  // 🧠 Question Paywall Check
  if (questionCount >= 3) {
    promptInput.disabled = true;
    askCrimznBtn.disabled = true;
    document.getElementById("paywall").style.display = "block";
  }

  // 🔌 Connect Wallet
  async function connectWallet() {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom wallet not detected. Please install Phantom to continue.");
      return;
    }

    const { publicKey } = await window.solana.connect();
    connectedWallet = publicKey.toString();
    window.connectedWallet = connectedWallet;
    walletStatus.innerHTML = `Connected: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;

    // ✅ FIX #1: Toggle button visibility on connect
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "inline-block";

    // ✅ FIX #2: Run unlock/payment/profile checks
    await checkUnlockStatus(connectedWallet);
    await loadUserProfile(connectedWallet);
  }

  // 🔌 Disconnect Wallet
  async function disconnectWallet() {
    connectedWallet = null;
    localStorage.removeItem("questionCount");
    localStorage.removeItem("hasPaid");
    hasPaid = false;
    walletStatus.innerHTML = "🔌 Wallet disconnected.";

    // ✅ FIX #3: Toggle button visibility on disconnect
    disconnectBtn.style.display = "none";
    connectBtn.style.display = "inline-block";
  }

  // 💾 Load saved greeting from Firebase
  async function loadUserProfile(wallet) {
    try {
      const res = await fetch(`/api/profiles/${wallet}`);
      const profile = await res.json();
      const greeting = `👋 Welcome back to <strong>CryptoConsult</strong> — the only AI that understands your inner degen. Let’s get it 🔥`;
      document.getElementById("wallet-status").innerHTML += ` - ${greeting}`;
    } catch (e) {
      console.error("❌ Failed to load saved profile.");
    }
  }

  // 🖊️ Save Profile with Signature
  async function signMessageAndSaveProfile(walletAddress) {
    if (!walletAddress || !window.solana) {
      alert("⚠️ Missing wallet.");
      return;
    }

    const name = prompt("Enter a display name for your profile (optional):") || "";
    const email = prompt("Enter your email for updates or future rewards (optional):") || "";

    const message = `Save my profile on CryptoConsult: ${walletAddress}`;
    const encodedMessage = new TextEncoder().encode(message);
    const signed = await window.solana.signMessage(encodedMessage, "utf8");

    try {
      const res = await fetch("/api/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          name,
          email,
          signature: signed.signature,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Profile saved successfully.");
        // ❌ REMOVED: Hide saveProfileBtn after saving (so it's always visible for rewards) ✅ FIX #4
        // document.getElementById("saveProfileBtn").style.display = "none";
      } else {
        alert("❌ Failed to save profile.");
      }
    } catch (err) {
      console.error("⚠️ Signature error:", err);
      alert("❌ Signature required to save your profile.");
    }
  }

  // 🔓 Firebase Unlock Status
  async function checkUnlockStatus(pubKey) {
    try {
      const res = await fetch(`/api/check-unlock?wallet=${pubKey}`);
      const data = await res.json();
      if (data.unlocked) {
        localStorage.setItem("hasPaid", "true");
        hasPaid = true;
        console.log("✅ Firebase confirms unlock. CrimznBot is free to use.");
      } else {
        console.log("⛔ Wallet has NOT unlocked CrimznBot yet.");
      }
    } catch (e) {
      console.error("❌ Unlock check failed:", e);
    }
  }

  // 💰 Fetch Live Prices
  async function updatePricesForCrimznBot() {
    try {
      const res = await fetch("/api/prices"); // ✅ FIX #3: Uses backend proxy
      const data = await res.json();
      document.getElementById("btc-price").innerText = `₿ ${data.bitcoin.usd}`;
      document.getElementById("eth-price").innerText = `Ξ ${data.ethereum.usd}`;
      document.getElementById("sol-price").innerText = `◎ ${data.solana.usd}`;
    } catch (err) {
      console.error("⚠️ Failed to update prices:", err);
    }
  }

  // 🤖 CrimznBot Ask Logic
  askCrimznBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    responseBox.innerText = "💬 CrimznBot is thinking...";

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: connectedWallet }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Invalid response from CrimznBot server.");
      }

      const data = await res.json();
      const botReply = data.response || "⚠️ CrimznBot didn’t reply.";
      responseBox.innerHTML = `<span style="color: lime;">${botReply}</span>`;
    } catch (err) {
      responseBox.innerHTML = `<span style="color: red;">❌ CrimznBot Error: ${err.message}</span>`;
      console.error("❌ /api/crimznbot Error:", err);
    }
  });

  // 📊 PulseIt Sentiment Analyzer
  pulseitBtn.addEventListener("click", async () => {
    const topic = pulseitInput.value.trim();
    if (!topic) return;

    pulseitBox.innerText = "🔄 Analyzing sentiment...";

    try {
      const res = await fetch(`/api/sentiment?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      pulseitBox.innerText = `📊 Sentiment Score: ${data.score}\n\n📝 Summary: ${data.summary}`;
    } catch (err) {
      pulseitBox.innerText = "❌ Failed to fetch sentiment.";
      console.error("⚠️ PulseIt Error:", err);
    }
  });

// 🧠 Legacy Wrapper for Unlock (for compatibility)
async function checkIfUnlocked(pubKey) {
  return await checkUnlockStatus(pubKey);
}

}); // 🧠 End DOMContentLoaded

// 🔁 Script cache-bust: crimznJuly25v2
// 🔁 Force bust Fri Jul 25 23:03:39 EDT 2025
