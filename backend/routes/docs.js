const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Serve raw markdown
router.get('/markdown', (req, res) => {
  const mdPath = path.join(__dirname, '../../OPEN_API_DOCS.md');
  if (fs.existsSync(mdPath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.sendFile(mdPath);
  } else {
    res.status(404).send('Documentation file not found');
  }
});

// Serve interactive HTML documentation page
router.get('/', (req, res) => {
  const host = req.get('host') || '69.57.163.97:4545';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}/api/open`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RiskVision Open API Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.15);
      --success: #10b981;
      --warning: #f59e0b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --code-bg: #0b1120;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2.5rem 1.5rem;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 2rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
      margin-bottom: 1rem;
    }
    h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p.lead { color: var(--text-muted); font-size: 1.1rem; }
    
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .card h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .key-box {
      background: var(--code-bg);
      border: 1px solid #2d3748;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      overflow-x: auto;
    }
    .key-label { color: var(--text-muted); }
    .key-val { color: #38bdf8; font-weight: 600; }
    
    .btn-copy {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-copy:hover {
      background: #334155;
      color: white;
    }

    .endpoint-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .endpoint-header {
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .method-get {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      font-size: 1rem;
      color: #f3f4f6;
    }
    .endpoint-body {
      padding: 1.25rem;
    }
    .desc { color: var(--text-muted); margin-bottom: 1rem; font-size: 0.95rem; }

    pre {
      background: var(--code-bg);
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      margin-top: 0.5rem;
      position: relative;
    }

    .download-bar {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="badge">RiskVision Core Banking</span>
      <h1>Open API Documentation</h1>
      <p class="lead">Secure, read-only data sharing interface for external partners & consumers.</p>
      
      <div class="download-bar">
        <a href="/api/docs/markdown" class="btn-primary" target="_blank">📥 Download OPEN_API_DOCS.md</a>
      </div>
    </header>

    <div class="card">
      <h2>🔐 Authentication</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">
        All API requests must include the <code>x-api-key</code> HTTP header.
      </p>
      <div class="key-box">
        <div>
          <span class="key-label">Header:</span> <span class="key-val">x-api-key</span><br/>
          <span class="key-label">API Key:</span> <span class="key-val" id="apiKeyText">riskvision_external_share_key_999</span>
        </div>
        <button class="btn-copy" onclick="copyText('riskvision_external_share_key_999')">Copy Key</button>
      </div>
    </div>

    <div class="card">
      <h2>🌐 Base URL</h2>
      <div class="key-box">
        <span class="key-val" id="baseUrlText">${baseUrl}</span>
        <button class="btn-copy" onclick="copyText('${baseUrl}')">Copy URL</button>
      </div>
    </div>

    <h2 style="margin: 2rem 0 1rem 0;">📡 Available Endpoints</h2>

    <!-- Endpoint 1 -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/clients</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Query: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Retrieves a list of clients, KYC status, and attached bank accounts.</p>
        <p style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">cURL Request</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/clients?limit=10"</code></pre>
      </div>
    </div>

    <!-- Endpoint 2 -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/accounts</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Query: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Retrieves bank accounts, current balances, currency, and owner details.</p>
        <p style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">cURL Request</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/accounts?limit=10"</code></pre>
      </div>
    </div>

    <!-- Endpoint 3 -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method-get">GET</span>
          <span class="endpoint-path">/transactions</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Query: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Retrieves the transaction ledger including source/destination accounts and amounts.</p>
        <p style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">cURL Request</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/transactions?limit=10"</code></pre>
      </div>
    </div>

    <!-- Error Handling -->
    <div class="card">
      <h2>⚠️ Error Responses</h2>
      <p class="desc">Failed requests return appropriate HTTP status codes and a JSON error message:</p>
      <pre><code>// 401 Unauthorized
{
  "error": "Clé API (x-api-key) manquante ou invalide"
}</code></pre>
    </div>
  </div>

  <script>
    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
      });
    }
  </script>
</body>
</html>`;

  res.send(html);
});

module.exports = router;
