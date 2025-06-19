let walletAddress = null;

async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect();
      walletAddress = res.publicKey.toString();
      document.getElementById("wallet-address").textContent = "🔗 " + walletAddress;
      document.getElementById("connect-btn").style.display = "none";
      document.getElementById("disconnect-btn").style.display = "inline-block";
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  } else {
    alert("Phantom Wallet not detected. Please install it.");
  }
}

function disconnectWallet() {
  walletAddress = null;
  document.getElementById("wallet-address").textContent = "❌ Not connected";
  document.getElementById("connect-btn").style.display = "inline-block";
  document.getElementById("disconnect-btn").style.display = "none";
}
