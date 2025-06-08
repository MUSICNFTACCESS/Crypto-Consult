const fs = require('fs');
const path = require('path');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const fileName = `${yyyy}-${mm}-${dd}.html`;
const blogDir = path.join(__dirname, 'public', 'blog');
const filePath = path.join(blogDir, fileName);

const postTitle = `🟠 BTC Market Update – ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

const blogPostHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${postTitle}</title>
  <style>
    body {
      background-color: #000;
      color: #f7931a;
      font-family: 'Courier New', Courier, monospace;
      padding: 20px;
      max-width: 800px;
      margin: auto;
    }
    h1, h2 {
      color: #f7931a;
    }
    .summary {
      margin-top: 20px;
      border-top: 1px solid #f7931a;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <h1>${postTitle}</h1>

  <p><strong>Price:</strong> $105,671</p>
  <p><strong>Key Levels:</strong><br>
    - ✅ Breakouts held: $90,362, $92,916–$95,653, $96,000<br>
    - 🚫 No breakdowns: $88,339, $85,072–$85,011 not touched
  </p>

  <p><strong>ETF Flows:</strong> Net outflows (~$248M on June 6), short-term risk-off behavior.<br>
  Watching for reversal and return of institutional inflows.</p>

  <p><strong>BTC Dominance:</strong> ~63.5% holding steady. No altseason confirmation yet.</p>

  <p><strong>SOL/BTC:</strong> Rejected at 0.0016556 BTC; current ~0.0014. SOL underperforming BTC.</p>

  <div class="summary">
    <h2>🧠 Thesis:</h2>
    <p>Bitcoin is holding above all major breakout zones, even with recent ETF outflows. Unless dominance falls or price breaks below $96K, the bull trend remains intact.</p>
    <p>Watching for signs of consolidation or a push toward $110K. Risk builds only on loss of $96K or ETF outflows accelerating further.</p>
  </div>
</body>
</html>`;

// Write blog post
fs.writeFileSync(filePath, blogPostHTML);

// Update blog.html
const blogHTMLPath = path.join(blogDir, 'blog.html');
let blogHTML = fs.readFileSync(blogHTMLPath, 'utf8');

const linkLine = `<a href="${fileName}">🟠 ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} – BTC Market Overview</a>`;

if (!blogHTML.includes(fileName)) {
  blogHTML = blogHTML.replace(/<h2>🗓️ Latest Posts<\/h2>/, `<h2>🗓️ Latest Posts</h2>\n  ${linkLine}`);
  fs.writeFileSync(blogHTMLPath, blogHTML);
  console.log(`✅ Blog post created: ${filePath}`);
  console.log(`✅ Link added to blog.html`);
} else {
  console.log(`⚠️ Post for today already exists.`);
}
