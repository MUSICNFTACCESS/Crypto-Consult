// 🎛️ Full-site logic: CrimznBot + PulseIt + Cycle Radar + Heatmap + Charts

// ───────────────── CrimznBot (GPT‑4o) with paywall logic ──────────────────────
let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
const MAX_FREE = 3;
const input = document.getElementById("user-input");
const chatbox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-button");

sendBtn.addEventListener("click", async () => {
  let q = input.value.trim();
  if (!q) return;

  if (questionCount >= MAX_FREE && !localStorage.getItem("paidUser")) {
    chatbox.innerHTML += `<div class="bot">🔒 Free limit reached — please pay or connect wallet.</div>`;
    input.disabled = true;
    sendBtn.disabled = true;
    localStorage.setItem("paywallTriggered", "true");
    return;
  }

  chatbox.innerHTML += `<div class="user">🧑‍💻 ${q}</div>`;
  input.value = "";
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q })
    });
    const d = await res.json();
    chatbox.innerHTML += d.answer
      ? `<div class="bot">🧠 ${d.answer}</div>`
      : `<div class="bot">❌ No answer returned.</div>`;
    questionCount++;
    localStorage.setItem("questionCount", questionCount);
  } catch (err) {
    chatbox.innerHTML += `<div class="bot">⚠️ Error: ${err.message}</div>`;
  }

  chatbox.scrollTop = chatbox.scrollHeight;
});

input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendBtn.click();
});

// Unlock via paid OR wallet OR ?paid=true OR solunlock=true
window.onload = () => {
  const urlp = new URLSearchParams(window.location.search);
  if (urlp.get("paid") === "true" || urlp.get("solunlock") === "true") {
    localStorage.setItem("paidUser", "true");
    input.disabled = false;
    sendBtn.disabled = false;
  }
};

// ─────────── PulseIt sentiment (GPT‑4o) ───────────────
const pulseBtn = document.getElementById("pulse-button");
if (pulseBtn) pulseBtn.addEventListener("click", async () => {
  const term = document.getElementById("pulse-input").value.trim();
  const out = document.getElementById("pulse-result");
  if (!term) return (out.innerText = "❌ Enter something");

  out.innerText = "🧠 Analyzing...";
  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: term })
    });
    const d = await res.json();
    out.innerHTML = `📡 Market Sentiment: <strong>${d.summary}</strong> (${d.sentiment_score})`;
  } catch (e) {
    out.innerText = `⚠️ PulseIt error: ${e.message}`;
  }
});

// ─────────── Market Metrics & Radar ───────────────
async function fetchRadar() {
  try {
    const g = await fetch("https://api.coingecko.com/api/v3/global");
    const gd = await g.json();
    const btc = gd.data.market_cap_percentage.btc.toFixed(1);
    document.getElementById("btc-dom").textContent = `${btc}%`;
    document.getElementById("status").textContent = btc > 54
      ? "🔴 Tipping Risk · Possible Top" : "🟢 Cycle Safe Zone";
  } catch {
    document.getElementById("btc-dom").textContent = "N/A";
    document.getElementById("status").textContent = "❓ Unknown";
  }
  try {
    const f = await fetch("https://api.alternative.me/fng/?limit=1");
    const fd = await f.json();
    const label = fd.data[0].value_classification;
    document.getElementById("cycle-fear").textContent = label;
  } catch {
    document.getElementById("cycle-fear").textContent = "N/A";
  }
}

// ─────────── Altcoin Heatmap ───────────────
async function updateHeatmap() {
  const symbols = ['ETH','SOL','AVAX','LINK','ONDO','PEPE'];
  const hm = document.getElementById("heatmap");
  hm.innerHTML = "";
  for (let s of symbols) {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${s.toLowerCase()}`);
      const d = await res.json();
      const ch = d.market_data.price_change_percentage_24h.toFixed(2);
      const color = ch > 0 ? "#00cc66" : "#ff3333";
      hm.innerHTML += `<div style="color:${color};">${s}: ${ch}%</div>`;
    } catch {
      hm.innerHTML += `<div style="color:#ccc;">${s}: N/A</div>`;
    }
  }
}

// ─────────── TradingView Chart Tabs ───────────────
const chartBtns = document.querySelectorAll('.chart-btn');
const iframes = document.querySelectorAll('.chart');

chartBtns.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    chartBtns.forEach(el => el.classList.remove("active"));
    iframes.forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    iframes[i].classList.add("active");
  });
});

// ─────────── Initial load & intervals ───────────────
fetchRadar();
updateHeatmap();
setInterval(fetchRadar, 60000);
setInterval(updateHeatmap, 300000);
