console.log("🧠 Crimzn Consult v=crimznAug08v6 loaded", new Date().toISOString());

// ✅ Crimzn Consult - app-main.js (Aug 8, 2025)
// Fixes: PulseIt path, stale price badge, debounce buttons, Enter-to-submit, newer Solana blockhash

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const connectBtn    = document.getElementById("connectWalletBtn");
    const disconnectBtn = document.getElementById("disconnectWalletBtn");
    const saveBtn       = document.getElementById("saveProfileBtn");
    const askBtn        = document.getElementById("askBtn");
    const pulseBtn      = document.getElementById("pulseBtn");
    const solanaPayBtn  = document.getElementById("solana-pay-btn");

    const nameInput    = document.getElementById("name");
    const emailInput   = document.getElementById("email");
    const userInput    = document.getElementById("user-input");
    const responseBox  = document.getElementById("response-box");
    const pulseInput   = document.getElementById("pulseInput");
    const pulseResult  = document.getElementById("pulseResult");
    const walletStatus = document.getElementById("walletStatus");

    let connectedWallet = null;

    // ================= UNLOCK via Phantom deeplink + server verify =================
    if (solanaPayBtn) {
      solanaPayBtn.onclick = async () => {
        try {
          // 1) open Phantom send UI
          const receiver = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
          const amountSol = 0.025;

          // we’ll verify against this sender, so make sure we have it
          if (!connectedWallet) {
            try {
              const resp = await (window.phantom?.solana ?? window.solana)?.connect();
              connectedWallet = resp?.publicKey?.toString();
            } catch (e) {
              return alert("Connect your wallet first.");
            }
          }

          const url = new URL(`solana:${receiver}`);
          url.searchParams.set("amount", amountSol.toString());
          url.searchParams.set("label", "CrimznBot Unlock");
          url.searchParams.set("message", "Unlock CrimznBot access");
          window.location.href = url.toString(); // opens Phantom

          // 2) poll backend for confirmation for up to ~90s
          const started = Date.now();
          const poll = async () => {
            const qs = new URLSearchParams({
              sender: connectedWallet,
              receiver,
              amount: (amountSol).toString(),
            });
            const r = await fetch(`/verify-unlock?${qs}`, { cache: "no-store" });
            if (r.ok) {
              const j = await r.json();
              if (j?.confirmed === true) return true;
            }
            return false;
          };

          const timeoutMs = 90_000, intervalMs = 3000;
          while (Date.now() - started < timeoutMs) {
            await new Promise(r => setTimeout(r, intervalMs));
            if (await poll()) break;
          }

          const ok = await (async () => {
            const qs = new URLSearchParams({
              sender: connectedWallet, receiver, amount: amountSol.toString()
            });
            const r = await fetch(`/verify-unlock?${qs}`, { cache: "no-store" });
            return r.ok && (await r.json())?.confirmed === true;
          })();

          if (!ok) return alert("Still waiting for payment… if you sent it, give it a moment and try again.");

          localStorage.setItem("hasPaid", "true");
          document.getElementById("paywall")?.classList.add("hidden");
          document.getElementById("solana-pay-btn")?.classList.add("hidden");
          const s = document.getElementById("unlockStatus");
          if (s) { s.style.display = "block"; s.style.color = "lime"; s.textContent = "✅ CrimznBot Unlocked!"; }
          alert("✅ CrimznBot unlocked!");
        } catch (e) {
          alert(`Unlock failed — ${e?.message || e}`);
        }
      };
    }
    // ================= /UNLOCK =================

    // ========================= SAVE PROFILE (unchanged) =========================
    if (saveBtn) {
      saveBtn.onclick = async () => {
        if (!connectedWallet) return alert("⚠️ Connect your wallet first.");

        const profile = {
          wallet: connectedWallet,
          name:  (nameInput?.value || "Anonymous"),
          email: (emailInput?.value || "not provided"),
        };

        try {
          const res = await fetch("/save-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile),
          });
          const result = await res.text();
          alert(result);
        } catch (e) {
          alert("❌ Failed to save profile.");
        }
      };
    }
    // ========================= /SAVE PROFILE =========================

    // ========================= PAYWALL HIDE IF ALREADY PAID (unchanged) =========================
    if (localStorage.getItem("hasPaid") === "true") {
      document.getElementById("paywall")?.classList.add("hidden");
      solanaPayBtn?.classList.add("hidden");
    }
    // ========================= /PAYWALL =========================

    // ========================= WALLET CONNECT/DISCONNECT (unchanged) =========================
    if (window.solana && window.solana.isPhantom) {
      if (connectBtn) {
        connectBtn.onclick = async () => {
          try {
            const resp = await window.solana.connect();
            connectedWallet = resp.publicKey.toString();
            localStorage.setItem("wallet", connectedWallet);
            if (walletStatus) walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
            connectBtn.classList.add("hidden");
            disconnectBtn?.classList.remove("hidden");
          } catch (e) {
            alert("❌ Wallet connection failed.");
          }
        };
      }

      if (disconnectBtn) {
        disconnectBtn.onclick = () => {
          connectedWallet = null;
          localStorage.removeItem("wallet");
          if (walletStatus) walletStatus.innerText = "🔌 Not connected";
          connectBtn?.classList.remove("hidden");
          disconnectBtn.classList.add("hidden");
        };
      }

      const savedWallet = localStorage.getItem("wallet");
      if (savedWallet) {
        try {
          const resp = await window.solana.connect({ onlyIfTrusted: true });
          connectedWallet = resp.publicKey.toString();
          if (walletStatus) walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
          connectBtn?.classList.add("hidden");
          disconnectBtn?.classList.remove("hidden");
        } catch (e) {
          console.warn("Auto-connect failed.");
        }
      }
    } else {
      alert("👻 Phantom Wallet not found. Please install it.");
    }
    // ========================= /WALLET =========================

    // ========================= ASK: CrimznBot (3-free local limiter + faster UX) — UPDATED =========================
    if (askBtn && userInput && responseBox) {
      userInput.addEventListener("keydown", e => { if (e.key === "Enter") askBtn.click(); });

      const FREE_LIMIT = 3;

      function showPaywall() {
        const paywall = document.getElementById("paywall");
        const btn = document.getElementById("solana-pay-btn");

        console.log("showPaywall() triggered");

        paywall?.classList.remove("hidden");
        btn?.classList.remove("hidden");

        if (btn) {
          btn.style.display = "inline-block";
          btn.removeAttribute("disabled");
        }

        btn?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      askBtn.onclick = async () => {
        const prompt = userInput.value.trim();
        const hasPaid = localStorage.getItem("hasPaid") === "true";
        const localKey = `askedLocal:${connectedWallet}`;

        if (!prompt || !connectedWallet) {
          responseBox.innerText = "⚠️ Enter a question and connect wallet.";
          return;
        }

        let askedLocal = parseInt(localStorage.getItem(localKey) || "0", 10);
        console.log("📊 Free Q count (before):", askedLocal, "Paid:", hasPaid);

        if (!hasPaid && askedLocal >= FREE_LIMIT) {
          responseBox.innerHTML = `
            <div style="margin-top:8px">
              <button id="payNowInline" class="solana-button">🔓 Unlock with 0.025 SOL</button>
            </div>
          `;
          showPaywall();
          document.getElementById("solana-pay-btn")?.classList.remove("hidden");
          document.getElementById("payNowInline")?.addEventListener("click", () => {
            document.getElementById("solana-pay-btn")?.click();
          });
          return;
        }

        if (!hasPaid) {
          askedLocal = Math.min(FREE_LIMIT, askedLocal + 1);
          localStorage.setItem(localKey, String(askedLocal));
          console.log("➕ askedLocal (pre-send) →", askedLocal);
        }

        askBtn.disabled = true;
        responseBox.innerText = "🧠 Thinking…";

        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 25_000);

        try {
          const res = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, wallet: connectedWallet }),
            signal: ac.signal
          });
          clearTimeout(timeout);

          const answer = await res.text();
          responseBox.innerText = answer;

          if (!hasPaid && typeof answer === "string" && answer.includes("3 free questions used")) {
            responseBox.innerHTML = `
              <div style="margin-top:8px">
                <button id="payNowInline" class="solana-button">🔓 Unlock with 0.025 SOL</button>
              </div>
            `;
            showPaywall();
            document.getElementById("solana-pay-btn")?.classList.remove("hidden");
            document.getElementById("payNowInline")?.addEventListener("click", () => {
              document.getElementById("solana-pay-btn")?.click();
            });
            return;
          }
        } catch (e) {
          responseBox.innerText = "❌ Error getting answer.";
        }
      };
    }
    // ========================= /ASK =========================

    // ========================= PULSEIT SENTIMENT (unchanged) =========================
    if (pulseBtn && pulseInput && pulseResult) {
      pulseInput.addEventListener("keydown", e => { if (e.key === "Enter") pulseBtn.click(); });

      pulseBtn.onclick = async () => {
        const input = pulseInput.value.trim();
        if (!input) return;

        pulseBtn.disabled = true;
        pulseResult.innerText = "🧠 Analyzing...";
        try {
          const res = await fetch("/pulse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input }),
          });

          const json = await res.json();
          pulseResult.innerText = `${json.emoji || "⚪"} ${json.vibe || "Neutral"} — ${json.explanation || ""}`;
        } catch (e) {
          console.error("PulseIt error:", e);
          pulseResult.innerText = "❌ Error analyzing sentiment.";
        } finally {
          pulseBtn.disabled = false;
          pulseInput.value = "";
          pulseResult.scrollIntoView({ behavior: "smooth" });
        }
      };
    }
    // ========================= /PULSEIT =========================

    // ========================= MODAL OPEN/CLOSE (unchanged) =========================
    const openModalBtn  = document.getElementById("openProfileModal");
    const closeModalBtn = document.getElementById("closeProfileModal");
    const modal         = document.getElementById("profileModal");

    if (openModalBtn && closeModalBtn && modal) {
      openModalBtn.addEventListener("click", () => modal.classList.remove("hidden"));
      closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

      modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) modal.classList.add("hidden");
      });
    }
    // ========================= /MODAL =========================

    // ========================= LIVE PRICES (unchanged) =========================
    async function loadPrices() {
      try {
        const res  = await fetch("/livePrices");
        const data = await res.json();

        const fmt = v => (typeof v === "number" ? `$${v.toLocaleString()}` : "N/A");

        const btcEl = document.getElementById("btcPrice");
        const ethEl = document.getElementById("ethPrice");
        const solEl = document.getElementById("solPrice");

        if (btcEl) btcEl.innerText = fmt(data?.bitcoin?.usd);
        if (ethEl) ethEl.innerText = fmt(data?.ethereum?.usd);
        if (solEl) solEl.innerText = fmt(data?.solana?.usd);

        const staleEl = document.getElementById("price-stale");
        if (staleEl) staleEl.style.display = data && data._stale ? "inline" : "none";
      } catch (err) {
        console.warn("⚠️ Failed to load prices.", err);
        ["btcPrice", "ethPrice", "solPrice"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerText = "N/A";
        });
        const staleEl = document.getElementById("price-stale");
        if (staleEl) staleEl.style.display = "inline";
      }
    }

    loadPrices();
  } catch (err) {
    console.error("❌ Error in DOMContentLoaded:", err);
  }
});
