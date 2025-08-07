console.log("🧠 Crimzn Consult v=crimznAug07v2 loaded", new Date().toISOString());

// ✅ Crimzn Consult app-main.js vAug07
// 🔒 Verified Clean: No syntax or logic-breaking issues
// 📦 Includes: SolanaPay logic, Ask CrimznBot, PulseIt, Save Profile, Modal UI
// 🧠 Built & audited with ChatGPT-4o on Aug 7, 2025

// ✅ Crimzn Consult - app-main.js Full Patch (Aug 7, 2025)
// Fixes: saveProfileBtn error, askBtn scope, PulseIt sync, modal logic

document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const askBtn = document.getElementById("askBtn");
  const pulseBtn = document.getElementById("pulseBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const userInput = document.getElementById("user-input");
  const responseBox = document.getElementById("response-box");
  const pulseInput = document.getElementById("pulseInput");
  const pulseResult = document.getElementById("pulseResult");
  const walletStatus = document.getElementById("walletStatus");

  let connectedWallet = null;

  // ✅ Unlock CrimznBot
  solanaPayBtn.onclick = async () => {
    if (!connectedWallet) return alert("⚠️ Connect your wallet first.");

    try {
      const connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl("mainnet-beta")
      );
      const sender = new solanaWeb3.PublicKey(connectedWallet);
      const receiver = new solanaWeb3.PublicKey(
        "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF"
      );

      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: receiver,
          lamports: 25000000,
        })
      );

      transaction.feePayer = sender;
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      alert("✅ CrimznBot unlocked!");
      localStorage.setItem("hasPaid", "true");
      solanaPayBtn.classList.add("hidden");
      document.getElementById("paywall").classList.add("hidden");
    } catch (err) {
      console.error("❌ Unlock failed:", err);
      alert("❌ Unlock failed. Try again.");
    }
  };

  // ✅ Save Profile
  saveBtn.onclick = async () => {
    if (!connectedWallet) return alert("⚠️ Connect your wallet first.");

    const profile = {
      wallet: connectedWallet,
      name: nameInput.value || "Anonymous",
      email: emailInput.value || "not provided",
    };

    try {
      const res = await fetch("/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const result = await res.text();
      alert(result);
    } catch {
      alert("❌ Failed to save profile.");
    }
  };

  // Hide paywall if already paid
  if (localStorage.getItem("hasPaid") === "true") {
    document.getElementById("paywall").classList.add("hidden");
    solanaPayBtn.classList.add("hidden");
  }

  // ✅ Wallet Connect
  if (window.solana && window.solana.isPhantom) {
    connectBtn.onclick = async () => {
      try {
        const resp = await window.solana.connect();
        connectedWallet = resp.publicKey.toString();
        localStorage.setItem("wallet", connectedWallet);
        walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
        connectBtn.classList.add("hidden");
        disconnectBtn.classList.remove("hidden");
      } catch (e) {
        alert("❌ Wallet connection failed.");
      }
    };

    disconnectBtn.onclick = () => {
      connectedWallet = null;
      localStorage.removeItem("wallet");
      walletStatus.innerText = "🔌 Not connected";
      connectBtn.classList.remove("hidden");
      disconnectBtn.classList.add("hidden");
    };

    const savedWallet = localStorage.getItem("wallet");
    if (savedWallet) {
      try {
        const resp = await window.solana.connect({ onlyIfTrusted: true });
        connectedWallet = resp.publicKey.toString();
        walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
        connectBtn.classList.add("hidden");
        disconnectBtn.classList.remove("hidden");
      } catch (err) {
        console.warn("Auto-connect failed.");
      }
    }
  } else {
    alert("👻 Phantom Wallet not found. Please install it.");
  }

  // ✅ Ask CrimznBot
  askBtn.onclick = async () => {
    const prompt = userInput.value.trim();
    const hasPaid = localStorage.getItem("hasPaid") === "true";
    if (!prompt || !connectedWallet) {
      responseBox.innerText = "⚠️ Enter a question and connect wallet.";
      return;
    }

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: connectedWallet, hasPaid }),
      });

      const answer = await res.text();
      responseBox.innerText = answer;
    } catch {
      responseBox.innerText = "❌ Failed to get a response.";
    }

    userInput.value = "";
    responseBox.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ PulseIt Sentiment
  pulseBtn.onclick = async () => {
    const input = pulseInput.value.trim();
    if (!input) return;

    pulseResult.innerText = "🧠 Analyzing...";
    try {
      const res = await fetch("/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const json = await res.json();
      pulseResult.innerText = `🧠 Sentiment: ${json.result}`;
    } catch {
      pulseResult.innerText = "❌ Error analyzing sentiment.";
    }

    pulseInput.value = "";
    pulseResult.scrollIntoView({ behavior: "smooth" });
  };

  // 🪟 Modal Open/Close Logic
  const openModalBtn = document.getElementById("openProfileModal");
  const closeModalBtn = document.getElementById("closeProfileModal");
  const modal = document.getElementById("profileModal");

  if (openModalBtn && closeModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // 📈 Load Live Prices
  async function loadPrices() {
    try {
      const res = await fetch(
        "/livePrices"
      );
      const data = await res.json();

      const btc = data.bitcoin.usd.toLocaleString();
      const eth = data.ethereum.usd.toLocaleString();
      const sol = data.solana.usd.toLocaleString();

      document.getElementById("btcPrice").innerText = `$${btc}`;
      document.getElementById("ethPrice").innerText = `$${eth}`;
      document.getElementById("solPrice").innerText = `$${sol}`;
    } catch (err) {
      console.warn("⚠️ Failed to load prices (CoinGecko may be rate limiting).");
      document.getElementById("btcPrice").innerText = "N/A";
      document.getElementById("ethPrice").innerText = "N/A";
      document.getElementById("solPrice").innerText = "N/A";
    }
  }

  loadPrices(); // 🔁 Trigger on page load
}); // ✅ Final closing brace to balance all blocks
