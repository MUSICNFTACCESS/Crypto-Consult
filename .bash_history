nano ~/CryptoConsult/index.html
cd ~/CryptoConsult
git add index.html
git commit -m "Full site final: Bio, graffiti headers, purple buttons, music, pricing"
git push origin restore-gpt4o
nano ~/CryptoConsult/index.html
cd ~/CryptoConsult
git add index.html
git commit -m "Full final: original layout + support section + disclaimer"
git push origin restore-gpt4o
git log --oneline
git checkout aab7361
git stash && git checkout aab7361
cd ~/CryptoConsult
git checkout -b restore-working-version
git push origin restore-working-version
nano ~/CryptoConsult/index.html
cd ~/CryptoConsult
git add .
git commit -m "Fix: restored working index and corrected script path"
git push origin restore-working-version
nano ~/CryptoConsult/server.js
git add server.js
git commit -m "Fix: corrected OpenAI SDK usage"
git push origin restore-working-version
nano ~CryptoConsult/index.html
nano ~/CryptoConsult/index.html
cd ~/CryptoConsult
git add index.html
git commit -m "Fix: restored full index with music and correct layout"
git push origin restore-working-version
cd ~/CryptoConsult && git fetch origin && git checkout -B restore-loved-version 43ef7388d5da6c85b187286311107cc6d52c430e && git push origin restore-loved-version --force
nano ~/CryptoConsult/script.js
nano ~/CryptoConsult/server.js
git add . && git commit -m "Upgrade: GPT-4o bot with real-time token prices + music fix" && git push origin restore-loved-version
nano ~/CryptoConsult/package.json
npm install
nano ~/CryptoConsult/package.json
npm install
git add . && git commit -m "Fix: clean package.json with axios and openai" && git push origin restore-loved-version
nano ~/CryptoConsult/index.html
nano ~/CryptoConsult/chat.js
pm2 restart CryptoConsult
cd ~/CryptoConsult
pm2 start server.js --name CryptoConsult
pm2 save
pm2 list
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
nano ~/CryptoConsult/chat.js
pm2 restart CryptoConsult
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
nano ~/CryptoConsult/chat.js
pm2 restart CryptoConsult
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
nano ~/CryptoConsult/chat.js
pm2 restart CryptoConsult
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
cat ~/CryptoConsult/chat.js
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
cd ~/CryptoConsult
git add chat.js
git commit -m "Fix: update chat.js with SOL and PEPE price matching"
git push origin main
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
cd ~/CryptoConsult
git add chat.js
git commit -m "Debug: log token matches and CoinGecko price for SOL fix"
git push origin main
cd ~/CryptoConsult
git add chat.js
git commit -m "Debug: log token matches and CoinGecko price for SOL fix"
git push origin main
cd ~/CryptoConsult
git add chat.js
git commit -m "Fix: force deploy updated chat.js with SOL price logging"
git push origin main
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of PEPE and SOL?"}'
nano ~/CryptoConsult/style.css
git add style.css
git commit -m "Style: graffiti section titles with Orbitron font"
git push origin restore-loved-version
mv ~/CryptoConsult/style.css ~/CryptoConsult/public/style.css
mv ~/CryptoConsult/script.js ~/CryptoConsult/public/script.js
cd ~/CryptoConsult
git add public/style.css public/script.js chat.js
git commit -m "Fix: place frontend files in public folder + update chat.js"
git push origin restore-loved-version
cat ~/CryptoConsult/chat.js
cd ~/CryptoConsult
git add chat.js
git commit -m "Fix: force deploy updated chat.js with confident price logic"
git push origin restore-loved-version
cd ~/CryptoConsult
git add chat.js public/script.js public/style.css index.html
git commit -m "Fix: deploy working chat.js and moved frontend to public/"
git push origin restore-loved-version
nano ~/CryptoConsult/index.html
nano ~/CryptoConsult/script.js
git add script.js
git commit -m "Fix: enable CrimznBot output + music on click + price updates"
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
nano ~/CryptoConsult/chat.js
git add chat.js
git commit -m "Fix: inject live prices into GPT system prompt for confident CrimznBot"
git push origin restore-loved-version
nano ~/CryptoConsult/index.html
git add index.html
git commit -m "Full update: index with chat-response box, live UI, full content"
git push origin restore-loved-version
nano ~/CryptoConsult/public/script.js
git add public/script.js
git commit -m "Fix: show CrimznBot response under chat form"
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
cd ~/CryptoConsult && curl -o chat.js https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/final-chat.js && git add chat.js && git commit -m "Fix: confident GPT-4o replies with live prices injected into system prompt" && git push origin restore-loved-version
nano ~/CryptoConsult/public/script.js
git add public/script.js
git commit -m "Fix: clear previous CrimznBot response before new question"
git push origin restore-loved-version
cat > ~/CryptoConsult/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CryptoConsult by Crimzn</title>
  <link rel="stylesheet" href="style.css" />
  <script defer src="public/script.js"></script>
</head>
<body>
  <audio id="bgmusic" src="autoplay.mp3" preload="auto"></audio>

  <h1>CryptoConsult by Crimzn</h1>
  <div class="prices" id="prices">BTC, ETH, and SOL loading...</div>

  <p>Welcome to <strong>CryptoConsult</strong> — your personalized, AI-powered crypto advisory platform.</p>

  <h2>About Crimzn</h2>
  <p>I've worked in traditional finance for years and now focus on blockchain consulting across multiple chains.</p>

  <h2>Available Services</h2>
  <ul>
    <li>Technical Analysis</li>
    <li>Fundamental Analysis</li>
    <li>Wallet Setup & Security</li>
    <li>On-Ramping / Off-Ramping</li>
    <li>Risk Management</li>
    <li>Capital Allocation Strategy</li>
    <li>Smart Contract Guidance</li>
  </ul>

  <h2>Payments & Booking</h2>
  <p>
    Pay with:
    <a href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8">Coinbase</a> |
    <a href="https://paypal.me/crimzn" target="_blank">PayPal</a> |
    <a href="https://explorer.solana.com/address/6g13EP9RCEuBjcnqK1vAjXq9aYeP6RHrkcKp9zbz64RA">Solana</a>
  </p>

  <h2>CrimznBot</h2>
  <div id="crimznbot-container" style="max-width: 700px; margin: 20px auto; text-align: center;">
    <form id="chat-form" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      <input
        type="text"
        id="user-input"
        placeholder="Ask CrimznBot anything about crypto..."
        style="flex: 1; min-width: 250px; padding: 10px; border-radius: 6px; border: none; font-size: 1em;"
        autocomplete="off"
      />
      <button
        type="submit"
        style="background-color: #f7931a; color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
        Send
      </button>
    </form>
    <div id="chat-response"
      style="margin-top: 20px; background: #111; color: #f7931a; padding: 15px; border-radius: 10px; font-family: monospace; white-space: pre-wrap; text-align: left;">
    </div>
  </div>

  <h2>Disclaimer</h2>
  <p><strong>Crimzn is not a licensed financial advisor.</strong> All insights are educational guidance only.</p>
  <footer>Created by Crimzn | Powered by GPT-4o | Built for Bitcoin & Solana</footer>
</body>
</html>
EOF

git add index.html
git commit -m "Fix: corrected script path and refreshed CrimznBot layout"
git push origin restore-loved-version
cat > ~/CryptoConsult/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CryptoConsult by Crimzn</title>
  <link rel="stylesheet" href="style.css" />
  <script defer src="public/script.js"></script>
</head>
<body style="background-color: black; color: #f7931a; font-family: monospace; text-align: center; padding: 20px;">
  <audio id="bgmusic" src="autoplay.mp3" preload="auto"></audio>

  <h1 style="font-family: fantasy; color: white;">CryptoConsult by Crimzn</h1>
  <div class="prices" id="prices" style="margin-bottom: 20px;">BTC, ETH, and SOL loading...</div>

  <p>Welcome to <strong>CryptoConsult</strong> — your personalized, AI-powered crypto advisory platform.</p>

  <h2 style="font-family: fantasy; color: white;">About Crimzn</h2>
  <p>I've worked in traditional finance for nearly a decade and have been deep in crypto for 6+ years,
  through two full Bitcoin cycles. I'm certified in blockchain, tokenomics, and wrapped token infrastructure —
  with hands-on experience building decentralized apps, integrating Solana Pay and Coinbase Commerce,
  and tracking wallets across multiple chains.</p>

  <h2 style="font-family: fantasy; color: white;">Available Services</h2>
  <ul style="list-style-type: square; text-align: left; max-width: 600px; margin: auto;">
    <li>Technical Analysis</li>
    <li>Fundamental Analysis</li>
    <li>Wallet Setup & Security</li>
    <li>On-Ramping / Off-Ramping</li>
    <li>Risk Management</li>
    <li>Capital Allocation Strategy</li>
    <li>Smart Contract Guidance</li>
  </ul>

  <h2 style="font-family: fantasy; color: white;">Payments & Booking</h2>
  <p>Pay with:
    <a href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" style="color:#bb86fc;">Coinbase</a> |
    <a href="https://paypal.me/crimzn" target="_blank" style="color:#bb86fc;">PayPal</a> |
    <a href="https://explorer.solana.com/address/6g13EP9RCEuBjcnqK1vAjXq9aYeP6RHrkcKp9zbz64RA" style="color:#bb86fc;">Solana</a>
  </p>

  <h2 style="font-family: fantasy; color: white;">Personal 1-on-1 Consulting – $99.99</h2>
  <ul style="list-style-type: disc; text-align: left; max-width: 600px; margin: auto;">
    <li>Wallet Setup & Secure Storage</li>
    <li>Crypto On-Ramping & Off-Ramping</li>
    <li>Technical & Fundamental Analysis</li>
    <li>Risk Management Planning</li>
    <li>Capital Allocation Strategy</li>
    <li>Live Trading Support (BTC / SOL / ALT)</li>
  </ul>

  <div style="margin: 20px;">
    <a href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" style="background:#bb86fc;color:black;padding:10px 20px;border-radius:6px;text-decoration:none;margin:5px;display:inline-block;">Pay with Coinbase</a>
    <a href="https://paypal.me/crimzn" style="background:#bb86fc;color:black;padding:10px 20px;border-radius:6px;text-decoration:none;margin:5px;display:inline-block;">Pay with PayPal</a>
    <a href="https://explorer.solana.com/address/6g13EP9RCEuBjcnqK1vAjXq9aYeP6RHrkcKp9zbz64RA" style="background:#bb86fc;color:black;padding:10px 20px;border-radius:6px;text-decoration:none;margin:5px;display:inline-block;">Pay with Solana (Phantom)</a>
  </div>

  <h2 style="font-family: fantasy; color: white;">Ask CrimznBot</h2>
  <form id="chat-form" style="margin-bottom: 20px;">
    <input type="text" id="user-input" placeholder="Ask CrimznBot..." style="padding: 10px; width: 80%; max-width: 400px; border-radius: 6px;" />
    <button type="submit" style="background-color:#bb86fc;color:black;padding:10px 15px;border:none;border-radius:6px;font-weight:bold;">Send</button>
  </form>
  <div id="chat-response" style="margin-top: 20px; white-space: pre-wrap;"></div>

  <h2 style="font-family: fantasy; color: white;">Why CryptoConsult Exists</h2>
  <p>CrimznBot is powered by GPT-4o and offered 100% free — no signups, no catches. It's my way of helping the community get clear, honest answers about crypto, trading, and security.</p>
  <p>If you've found value here, consider tipping, booking a private session, or sharing this site with a friend. Every bit of support helps keep this running.</p>

  <h2 style="font-family: fantasy; color: white;">Disclaimer</h2>
  <p><strong>Crimzn is not a licensed financial advisor.</strong> All insights are for educational purposes only.</p>

  <footer style="margin-top: 30px;">© 2025 CryptoConsult by Crimzn</footer>
</body>
</html>
EOF

mkdir -p ~/CryptoConsult/public && cat > ~/CryptoConsult/public/script.js << 'EOF'
document.getElementById('chat-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const responseBox = document.getElementById('chat-response');
  const userMessage = input.value.trim();
  if (!userMessage) return;

  responseBox.innerText = "Thinking...";
  input.value = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();
    responseBox.innerHTML = `<strong>CrimznBot:</strong> ${data.reply}`;
  } catch (err) {
    responseBox.innerHTML = `<strong>CrimznBot:</strong> Error reaching server.`;
  }
});
EOF

cat > ~/CryptoConsult/public/style.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Rubik+Moonrocks&display=swap');

body {
  background-color: black;
  color: #f7931a;
  font-family: monospace;
  text-align: center;
  padding: 20px;
}

h1, h2 {
  font-family: 'Rubik Moonrocks', cursive;
  color: white;
  margin-top: 20px;
  text-transform: uppercase;
}

ul {
  list-style-type: square;
  text-align: left;
  max-width: 600px;
  margin: 10px auto;
  padding-left: 20px;
}

a {
  color: #bb86fc;
  text-decoration: underline;
}

a.button {
  background-color: #bb86fc;
  color: black;
  padding: 10px 15px;
  margin: 5px;
  border-radius: 6px;
  text-decoration: none;
  display: inline-block;
  font-weight: bold;
}

button {
  background-color: #bb86fc;
  color: black;
  font-weight: bold;
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

input[type="text"] {
  padding: 10px;
  width: 80%;
  max-width: 400px;
  border-radius: 6px;
  border: none;
}

footer {
  margin-top: 40px;
  font-size: 0.9em;
  color: #888;
}

#chat-response {
  margin-top: 20px;
  white-space: pre-wrap;
  color: white;
}
EOF

git add public/style.css
git commit -m "Style: graffiti font and purple UI for CrimznBot"
git push origin restore-loved-version
nano ~/CryptoConsult/chat.js
git add chat.js
git commit -m "Fix: CrimznBot now replies with confident live token prices"
git push origin restore-loved-version
git config --global user.name "MUSICNFTACCESS"
git config --global user.email "crimzncipriano@gmail.com"
cd ~/CryptoConsult
git add chat.js
git commit -m "Fix: CrimznBot now replies with confident live token prices"
git push origin restore-loved-version
cd ~/CryptoConsult
git add chat.js
git commit -m "Fix: CrimznBot now replies with confident live token prices"
git push origin restore-loved-version
ping -c 4 cryptoconsult-1.onrender.com
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the current price of Bitcoin?"}'
nano ~/CryptoConsult/chat.js
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
nano ~/CryptoConsult/chat.js
git add chat.js
git commit -m "Fix: force GPT-4o to use only live token prices"
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
echo "// dummy comment" >> chat.js
git add chat.js
git commit -m "Force rebuild: trigger clean deploy of updated CrimznBot"
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
echo "// force cache refresh" >> chat.js
git add chat.js
git commit -m "Trigger: force full rebuild and cache clear"
git push origin restore-loved-version
curl -s -X POST https://cryptoconsult-1.onrender.com/api/chat   -H "Content-Type: application/json"   -d '{"message":"What is the price of Bitcoin and ONDO?"}'
cd ~/CryptoConsult
git branch
cat ~/CryptoConsult/chat.js
cd ~/CryptoConsult && curl -o script.js https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/script.js && cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CryptoConsult by Crimzn</title>
  <link rel="stylesheet" href="style.css" />
  <script defer src="script.js"></script>
</head>
<body>
  <audio id="bgmusic" src="autoplay.mp3" preload="auto" autoplay loop></audio>

  <h1>CryptoConsult by Crimzn</h1>
  <div class="prices" id="prices">BTC, ETH, and SOL loading...</div>

  <p>
    Welcome to <strong>CryptoConsult</strong> — your personalized, AI-powered crypto guide.
  </p>

  <h2>About Crimzn</h2>
  <p>
    I’ve worked in traditional finance for years and now focus on blockchain tech, DeFi, and helping others break free from the system.
  </p>

  <h2>Available Services</h2>
  <ul>
    <li>Wallet setup & security guidance</li>
    <li>On-ramping & off-ramping</li>
    <li>Crypto portfolio allocation</li>
    <li>Technical & fundamental analysis</li>
    <li>Risk management consulting</li>
    <li>Smart contract reviews</li>
  </ul>

  <h2>Book a Session</h2>
  <p>Consultations are $99.99/hr, payable in crypto.</p>
  <a href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">
    <button>Pay with Coinbase</button>
  </a>
  <a href="solana:6g13EP9RCEuBjcnqK1vAjXq9aYeP6RHrkcKp9zbz64RA?amount=1" target="_blank">
    <button>Pay with Solana</button>
  </a>
  <a href="https://paypal.me/crimzn" target="_blank">
    <button>Pay with PayPal</button>
  </a>

  <h2>Talk to CrimznBot</h2>
  <form id="chat-form">
    <input type="text" id="user-input" placeholder="Ask me anything crypto..." required />
    <button type="submit">Send</button>
  </form>
  <div id="chatbox"></div>
</body>
</html>
EOF

cat > script.js << 'EOF'
document.addEventListener("DOMContentLoaded", async () => {
  const priceDiv = document.getElementById("prices");

  try {
    const [btc, eth, sol] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd").then(res => res.json()),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd").then(res => res.json()),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd").then(res => res.json())
    ]);

    priceDiv.innerHTML = `BTC: $${btc.bitcoin.usd.toLocaleString()} | ETH: $${eth.ethereum.usd.toLocaleString()} | SOL: $${sol.solana.usd.toLocaleString()}`;
  } catch (error) {
    console.error("Error fetching prices:", error);
    priceDiv.innerHTML = "Error loading prices";
  }
});
EOF

git add index.html script.js && git commit -m "Fix: live prices + Solana pay button" && git push origin main
nano ~/CryptoConsult/script.js
cd ~/CryptoConsult
git add script.js
git commit -m "Fix: confirmed price line includes BTC, ETH, SOL"
git push origin main
nano ~/CryptoConsult/index.html
cd ~/CryptoConsult
git add index.html
git commit -m "Verified: index.html correctly wired for price updates and Solana payments"
git push origin main
git restore style.css
git checkout main
git merge restore-loved-version
git push origin main
git status
cd ~/CryptoConsult && curl -o index.html https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/index.html && curl -o script.js https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/script.js && curl -o server.js https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/server.js && curl -o style.css https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/style.css && curl -o public/style.css https://raw.githubusercontent.com/MUSICNFTACCESS/CryptoConsult/main/public/style.css && git add . && git commit -m "Fix: resolved all merge conflicts using latest working files" && git push origin main
cd ~/CryptoConsult && sed -i 's|solana:[^"]*|solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=1|' index.html && git add index.html && git commit -m "Update: replaced Solana Pay address with new permanent one" && git push origin main
cd ~/CryptoConsult && sed -i 's|<a href="solana:[^"]*" target="_blank">[[:space:]]*<button>Pay with Solana</button>[[:space:]]*</a>|<button onclick="window.location.href='\''solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=1'\''">Pay with Solana</button>|' index.html && git add index.html && git commit -m "Fix: make Solana Pay button use JS redirect to avoid broken href" && git push origin main
