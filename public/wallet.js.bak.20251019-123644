document.addEventListener("DOMContentLoaded", () => {
  let walletAddress = null;

  const connectBtn = document.getElementById("connect-wallet");
  if (!connectBtn) return;

  connectBtn.addEventListener("click", async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const res = await window.solana.connect();
        walletAddress = res.publicKey.toString();
        connectBtn.innerText = `👻 ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        connectBtn.disabled = true;
      } catch (err) {
        console.error("Wallet connection failed:", err);
        alert("Connection to Phantom failed.");
      }
    } else {
      alert("Phantom Wallet not detected. Please install it.");
      window.open("https://phantom.app/", "_blank");
    }
  });
});
