import { useState } from 'react';

export default function ShareApiModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('client_profile');

  const baseUrl = 'http://69.57.163.97:4545/api/open';
  const docsUrl = 'http://69.57.163.97:4545/docs';
  const apiKey = 'riskvision_external_share_key_999';

  const endpoints = {
    client_profile: {
      name: 'Profil KYC 360° (Exemple C-001245)',
      method: 'GET',
      path: '/clients/C-001245',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/clients/C-001245"`
    },
    clients_list: {
      name: 'Liste Clients & Moteur KYC (9 tabs)',
      method: 'GET',
      path: '/clients?limit=5',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/clients?limit=5"`
    },
    client_update: {
      name: 'Mise à jour KYC (CRUD PUT)',
      method: 'PUT',
      path: '/clients/C-001245',
      curl: `curl -X PUT -H "x-api-key: ${apiKey}" -H "Content-Type: application/json" -d '{"tabs":{"financial":{"declaredIncome":"2,500,000 DA"}}}' "${baseUrl}/clients/C-001245"`
    },
    client_create: {
      name: 'Nouveau Client (CRUD POST)',
      method: 'POST',
      path: '/clients',
      curl: `curl -X POST -H "x-api-key: ${apiKey}" -H "Content-Type: application/json" -d '{"nom":"Mansouri","prenom":"Karim","email":"karim@dz.dz","type_client":"Professionnel","revenu_mensuel":150000}' "${baseUrl}/clients"`
    },
    ews_alert: {
      name: 'Déclencheur EWS (Early Warning System)',
      method: 'POST',
      path: '/clients/C-001245/ews',
      curl: `curl -X POST -H "x-api-key: ${apiKey}" "${baseUrl}/clients/C-001245/ews"`
    },
    accounts: {
      name: 'Comptes Bancaires & Vélocité',
      method: 'GET',
      path: '/accounts?limit=10',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/accounts?limit=10"`
    },
    credits: {
      name: 'Portefeuille Crédits & Défaut',
      method: 'GET',
      path: '/credits?limit=10',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/credits?limit=10"`
    },
    transactions: {
      name: 'Ledger Global des Opérations',
      method: 'GET',
      path: '/transactions?limit=10',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/transactions?limit=10"`
    },
    stats: {
      name: 'Statistiques Globales Simulateur',
      method: 'GET',
      path: '/stats',
      curl: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/stats"`
    }
  };

  const current = endpoints[selectedEndpoint];

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#0d1522',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#f8fafc',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        {/* Algerian Top Flag Ribbon */}
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, #006233 0%, #006233 45%, #ffffff 45%, #ffffff 55%, #d21034 55%, #d21034 100%)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🇩🇿</span>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Partager l'API RiskVision</h2>
              <span style={{
                background: 'rgba(0, 98, 51, 0.25)',
                color: '#34d399',
                border: '1px solid rgba(0, 98, 51, 0.5)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
              }}>
                Open API v1.0
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Partagez les données bancaires et le moteur KYC 360° avec vos partenaires externes.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.2rem',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Base URL */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Base URL Open API
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.4rem',
            }}>
              <input
                readOnly
                value={baseUrl}
                style={{
                  flex: 1,
                  background: '#070b12',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}
              />
              <button
                onClick={() => copyToClipboard(baseUrl, setCopiedUrl)}
                style={{
                  background: copiedUrl ? '#006233' : '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedUrl ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Clé d'Authentification (Header: <code>x-api-key</code>)
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.4rem',
            }}>
              <input
                readOnly
                value={apiKey}
                style={{
                  flex: 1,
                  background: '#070b12',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  color: '#fbbf24',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}
              />
              <button
                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                style={{
                  background: copiedKey ? '#006233' : '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedKey ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>
          </div>

          {/* Endpoint Selector & cURL generator */}
          <div style={{
            background: '#070b12',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                Exemple de requête cURL
              </span>
              <select
                value={selectedEndpoint}
                onChange={e => setSelectedEndpoint(e.target.value)}
                style={{
                  background: '#0d1522',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {Object.entries(endpoints).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.method} {item.path} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            <pre style={{
              background: '#050811',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '0.85rem',
              color: '#34d399',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: '0 0 0.75rem 0',
            }}>
              {current.curl}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => copyToClipboard(current.curl, setCopiedCurl)}
                style={{
                  background: copiedCurl ? '#006233' : '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copiedCurl ? '✓ Commande cURL copiée !' : '📋 Copier la commande cURL'}
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid #1e293b',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #006233 0%, #059669 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0, 98, 51, 0.4)',
              }}
            >
              📖 Ouvrir la Documentation Interactive 🚀
            </a>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
