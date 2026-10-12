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
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RiskVision Open API & KYC Engine Documentation 🇩🇿</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070b12;
      --card-bg: #0d1522;
      --card-border: #1e293b;
      --accent: #10b981;
      --dz-green: #006233;
      --dz-red: #d21034;
      --text: #f3f4f6;
      --text-muted: #94a3b8;
      --code-bg: #050811;
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
      max-width: 1000px;
      margin: 0 auto;
    }
    .flag-bar {
      height: 6px;
      background: linear-gradient(90deg, #006233 0%, #006233 45%, #ffffff 45%, #ffffff 55%, #d21034 55%, #d21034 100%);
      border-radius: 999px;
      margin-bottom: 2rem;
    }
    header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 2rem;
    }
    .badge-dz {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(0, 98, 51, 0.25);
      color: #34d399;
      border: 1px solid rgba(0, 98, 51, 0.5);
      margin-bottom: 1rem;
    }
    h1 { font-size: 2.4rem; font-weight: 800; margin-bottom: 0.5rem; }
    p.lead { color: var(--text-muted); font-size: 1.05rem; }
    
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
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
      border: 1px solid #1e293b;
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
    .key-val { color: #34d399; font-weight: 700; }
    
    .btn-copy {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-copy:hover {
      background: #006233;
      color: white;
      border-color: #10b981;
    }

    .endpoint-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      border-left: 4px solid var(--accent);
    }
    .endpoint-card.post { border-left-color: #3b82f6; }
    .endpoint-card.put { border-left-color: #f59e0b; }
    .endpoint-card.delete { border-left-color: #ef4444; }

    .endpoint-header {
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .method {
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .method-get { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .method-post { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .method-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .method-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 1.05rem;
      color: #ffffff;
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
    }

    .download-bar {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .btn-primary {
      background: #006233;
      color: white;
      text-decoration: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.2s;
      border: 1px solid #10b981;
    }
    .btn-primary:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="flag-bar"></div>
    <header>
      <span class="badge-dz">🇩🇿 Banque Algérienne de Simulation • RiskVision Core API</span>
      <h1>Open API & KYC Engine Documentation</h1>
      <p class="lead">Interface complète de partage de données et gestion CRUD du moteur KYC 360° pour partenaires externes.</p>
      
      <div class="download-bar">
        <a href="/api/docs/markdown" class="btn-primary" target="_blank">📥 Télécharger OPEN_API_DOCS.md</a>
      </div>
    </header>

    <div class="card">
      <h2>🔐 Authentification</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">
        Toutes les requêtes doivent inclure le header HTTP <code>x-api-key</code>.
      </p>
      <div class="key-box">
        <div>
          <span class="key-label">Header :</span> <span class="key-val">x-api-key</span><br/>
          <span class="key-label">Clé API :</span> <span class="key-val" id="apiKeyText">riskvision_external_share_key_999</span>
        </div>
        <button class="btn-copy" onclick="copyText('riskvision_external_share_key_999')">Copier la clé</button>
      </div>
    </div>

    <div class="card">
      <h2>🌐 Base URL</h2>
      <div class="key-box">
        <span class="key-val" id="baseUrlText">${baseUrl}</span>
        <button class="btn-copy" onclick="copyText('${baseUrl}')">Copier l'URL</button>
      </div>
    </div>

    <h2 style="margin: 2.5rem 0 1rem 0; font-size: 1.5rem;">📡 Endpoints Partagés (Moteur KYC & CRUD)</h2>

    <!-- Endpoint 1: List Clients -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/clients</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Paramètre: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Récupère la liste des clients avec le bloc <strong>1/ KYC ENGINE</strong> (9 onglets, scores de risque, alerte de changement) et leurs comptes rattachés.</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/clients?limit=5"</code></pre>
      </div>
    </div>

    <!-- Endpoint 2: Get Single Client by ID -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/clients/:id</span>
        </div>
        <span style="font-size: 0.85rem; color: #34d399;">Exemple: <code>1245</code> ou <code>C-001245</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Récupère le profil 360° complet d'un client spécifique (Identité, Professionnel, Financier, UBO, Documents, Dimensions de Risque, Baseline, Mismatch, Audit).</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/clients/C-001245"</code></pre>
      </div>
    </div>

    <!-- Endpoint 3: Update Client & KYC (CRUD PUT) -->
    <div class="endpoint-card put">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-put">PUT</span>
          <span class="endpoint-path">/clients/:id</span>
        </div>
        <span style="font-size: 0.85rem; color: #fbbf24;">CRUD Update</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Met à jour les informations KYC (Identité, Profession, Revenu, UBOs, statuts de pièces, dimensions de risque) pour un client.</p>
        <pre><code>curl -X PUT -H "x-api-key: riskvision_external_share_key_999" -H "Content-Type: application/json" \\
  -d '{"tabs":{"identity":{"fullName":"Noureddine Benali"},"financial":{"declaredIncome":"2,500,000 DA"}}}' \\
  "${baseUrl}/clients/C-001245"</code></pre>
      </div>
    </div>

    <!-- Endpoint 4: Create Client (CRUD POST) -->
    <div class="endpoint-card post">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-post">POST</span>
          <span class="endpoint-path">/clients</span>
        </div>
        <span style="font-size: 0.85rem; color: #60a5fa;">CRUD Create</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Crée un nouveau client avec son dossier KYC et ouvre automatiquement son premier compte bancaire commercial.</p>
        <pre><code>curl -X POST -H "x-api-key: riskvision_external_share_key_999" -H "Content-Type: application/json" \\
  -d '{"nom":"Mansouri","prenom":"Karim","email":"k.mansouri@algerie.dz","type_client":"Professionnel","profession":"Architecte","revenu_mensuel":150000}' \\
  "${baseUrl}/clients"</code></pre>
      </div>
    </div>

    <!-- Endpoint 5: Delete Client (CRUD DELETE) -->
    <div class="endpoint-card delete">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-delete">DELETE</span>
          <span class="endpoint-path">/clients/:id</span>
        </div>
        <span style="font-size: 0.85rem; color: #f87171;">CRUD Delete</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Supprime définitivement un client et clôture ses comptes rattachés.</p>
        <pre><code>curl -X DELETE -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/clients/12"</code></pre>
      </div>
    </div>

    <!-- Endpoint 6: Send to EWS -->
    <div class="endpoint-card post">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-post">POST</span>
          <span class="endpoint-path">/clients/:id/ews</span>
        </div>
        <span style="font-size: 0.85rem; color: #d21034; font-weight: 700;">🚨 Early Warning System</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Transmet les signaux de déviation KYC (KYC Change: 78, Transaction Anomaly: 82, New Beneficiary Risk: 75, Geographic Risk: 60) directement au système EWS.</p>
        <pre><code>curl -X POST -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/clients/C-001245/ews"</code></pre>
      </div>
    </div>

    <!-- Endpoint 7: Accounts -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/accounts</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Paramètre: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Récupère les comptes bancaires avec métriques de vélocité (flux mensuels entrants/sortants, score de risque compte, niveau d'alerte).</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/accounts?limit=10"</code></pre>
      </div>
    </div>

    <!-- Endpoint 8: Transactions -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/transactions</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Paramètre: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Grand livre global des opérations bancaires entre comptes.</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/transactions?limit=10"</code></pre>
      </div>
    </div>

    <!-- Endpoint 9: Credits / Loans -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/credits</span>
        </div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Paramètre: <code>?limit=100</code></span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Portefeuille de crédits et prêts (immobilier, consommation, investissement) enrichi avec impayés, jours de retard, taux d'endettement et statut de défaut.</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/credits?limit=10"</code></pre>
      </div>
    </div>

    <!-- Endpoint 10: Global Stats -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="method method-get">GET</span>
          <span class="endpoint-path">/stats</span>
        </div>
        <span style="font-size: 0.85rem; color: #34d399;">Indicateurs Globaux</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Indicateurs clés du simulateur bancaire : total clients, encours des dépôts, volume des crédits en défaut, transactions et conformité KYC.</p>
        <pre><code>curl -H "x-api-key: riskvision_external_share_key_999" "${baseUrl}/stats"</code></pre>
      </div>
    </div>

  </div>

  <script>
    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copié dans le presse-papier : ' + text);
      });
    }
  </script>
</body>
</html>`;

  res.send(html);
});

module.exports = router;
