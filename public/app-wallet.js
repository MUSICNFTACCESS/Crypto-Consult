// ✅ Phantom Wallet Connect – Crimzn Style

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWalletBtn");

  // Store globally for access in app-main.js
  window.connectedWallet = null;

  connectBtn?.addEventListener("click", async () => {
    try {
      const provider = window?.phantom?.solana;

      if (!provider?.isPhantom) {
        alert("🛑 Phantom Wallet not found. Please install it first.");
        return;
      }

      const resp = await provider.connect();
      window.connectedWallet = resp.publicKey.toString();

      connectBtn.innerText = `✅ Connected: ${window.connectedWallet.slice(0, 4)}...${window.connectedWallet.slice(-4)}`;
      connectBtn.disabled = true;
    } catch (err) {
      console.error("❌ Wallet connect error:", err);
      alert("⚠️ Wallet connection failed.");
    }
  });
});
