import { useState, useEffect } from 'react';
import { getKycEngine, sendKycToEws } from '../api';

export default function KycEngineModal({ clientId = 1245, onClose }) {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(true);
  const [ewsSending, setEwsSending] = useState(false);
  const [ewsSent, setEwsSent] = useState(false);
  const [ewsMessage, setEwsMessage] = useState(null);
  const [currentId, setCurrentId] = useState(clientId || 1245);

  useEffect(() => {
    loadProfile(currentId);
  }, [currentId]);

  const loadProfile = (id) => {
    setLoading(true);
    setEwsSent(false);
    setEwsMessage(null);
    getKycEngine(id)
      .then(data => setProfile(data))
      .catch(err => {
        console.error('Failed to load KYC engine profile:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleSendToEws = async () => {
    setEwsSending(true);
    try {
      const res = await sendKycToEws(currentId);
      setEwsSent(true);
      setEwsMessage(res.message || 'Alerte transmise avec succès au moteur EWS !');
    } catch (err) {
      alert('Erreur lors de la transmission à EWS: ' + err.message);
    } finally {
      setEwsSending(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const tabs = [
    { key: 'identity', label: 'Identity' },
    { key: 'business', label: 'Business' },
    { key: 'financial', label: 'Financial' },
    { key: 'ubo', label: 'UBO' },
    { key: 'documents', label: 'Documents' },
    { key: 'risk', label: 'Risk' },
    { key: 'behavior', label: 'Behavior' },
    { key: 'changes', label: 'Changes' },
    { key: 'history', label: 'History' },
  ];

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '900px', textAlign: 'center', padding: '3rem' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement du moteur KYC & Profil 360°...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { summary, tabs: dataTabs, accounts } = profile;
  const { identity, business, financial, ubo, documents, riskEngine, behavior, changes, history } = dataTabs;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content kyc-engine-modal" style={{ maxWidth: '1050px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* TOP HEADER */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}>1/ KYC ENGINE</span>
            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.35rem' }}>Customer Identity & Risk Profile</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentId !== 1245 && (
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setCurrentId(1245)}
                title="Charger l'exemple type du PDF (C-001245)"
              >
                ⭐ Charger Cas PDF (C-001245)
              </button>
            )}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* CUSTOMER PROFILE HEADER BOX (from KYC.PDF Page 1) */}
        <div className="customer-profile-card mt-md" style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>CUSTOMER PROFILE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Customer ID: <span style={{ color: '#38bdf8' }}>{summary.customerId}</span>
                </h3>
                <span className="badge success" style={{ fontSize: '0.75rem' }}>{summary.status}</span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {summary.clientName} ({summary.clientType})
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>KYC STATUS</span>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  {summary.kycStatus.toUpperCase()}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>RISK LEVEL</span>
                <span style={{ color: getRiskColor(summary.riskLevel), fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: getRiskColor(summary.riskLevel), display: 'inline-block' }}></span>
                  {summary.riskLevel}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>KYC SCORE</span>
                <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.15rem' }}>
                  {summary.kycScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
                </span>
              </div>
              <div className="metric-box" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Last KYC Review</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>{summary.lastKycReview}</span>
                <span className="metric-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Next: {summary.nextReview}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Change Banner if Alert Present */}
          {changes.profileChangeDetected && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#f87171', fontSize: '0.9rem' }}>KYC PROFILE CHANGE DETECTED: {changes.changeStatus}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Score de changement: <strong style={{ color: '#fca5a5' }}>{changes.changeScore}/100</strong> • Déviation d'activité & anomalie de flux observée
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-sm"
                onClick={() => setActiveTab('changes')}
                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.35rem 0.75rem' }}
              >
                Inspecter Mismatch ➔
              </button>
            </div>
          )}
        </div>

        {/* 9 NAVIGATION TABS (from KYC.PDF Page 2) */}
        <div className="tabs-nav mt-md" style={{ 
          display: 'flex', 
          gap: '0.35rem', 
          borderBottom: '1px solid var(--border-color)', 
          overflowX: 'auto',
          paddingBottom: '0.25rem' 
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === tab.key ? '#60a5fa' : 'var(--text-muted)',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              [{tab.label}]
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="tab-body mt-md" style={{ minHeight: '380px' }}>
          
          {/* ── 1. IDENTITY TAB ──────────────────────────────── */}
          {activeTab === 'identity' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  IDENTITY PROFILE & VERIFICATION
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span className="badge success">Identity Verification: {identity.identityVerification}</span>
                  <span className="badge success">Document Status: {identity.documentStatus}</span>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h5 style={{ marginBottom: '0.75rem', color: '#f1f5f9' }}>Informations Personnelles</h5>
                  <div className="info-list" style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Customer ID:</span> <strong>{identity.customerId}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Full Name:</span> <strong>{identity.fullName}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Date of Birth:</span> <strong>{identity.dateOfBirth}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Nationality:</span> <strong>{identity.nationality}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Country of Residence:</span> <strong>{identity.countryOfResidence}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Address:</span> <strong>{identity.address}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Phone:</span> <strong>{identity.phone}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Email:</span> <strong>{identity.email}</strong></div>
                  </div>
                </div>

                <div className="card">
                  <h5 style={{ marginBottom: '0.75rem', color: '#f1f5f9' }}>Identification Document</h5>
                  <div className="info-list" style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Document Type:</span> <strong>{identity.identificationDocument.documentType}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Document Number:</span> <strong>{identity.identificationDocument.documentNumber}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Issue Date:</span> <strong>{identity.identificationDocument.issueDate}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Expiry Date:</span> <strong>{identity.identificationDocument.expiryDate}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', width: '150px', display: 'inline-block' }}>Verification Status:</span> <span className="badge success">{identity.identificationDocument.verificationStatus}</span></div>
                  </div>
                  
                  <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem' }}>
                      <span>✓ Contrôle biométrique & vérification CNI validés</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. BUSINESS / PROFESSIONAL TAB ───────────────── */}
          {activeTab === 'business' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  BUSINESS / PROFESSIONAL PROFILE ({business.profileType})
                </h4>
                <span className="badge neutral">Profil : {business.profileType}</span>
              </div>

              {business.profileType === 'Company' ? (
                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Fiche Entreprise / Personne Morale</h5>
                  <div className="grid-2" style={{ fontSize: '0.88rem', rowGap: '0.75rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Legal Name:</span> <br/><strong>{business.legalName}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Legal Form:</span> <br/><strong>{business.legalForm}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Registration Number:</span> <br/><strong>{business.registrationNumber}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Business Activity:</span> <br/><strong>{business.businessActivity}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Sector:</span> <br/><strong>{business.sector}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Country of Incorporation:</span> <br/><strong>{business.countryOfIncorporation}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Countries of Operation:</span> <br/><strong>{Array.isArray(business.countriesOfOperation) ? business.countriesOfOperation.join(', ') : business.countriesOfOperation}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Annual Turnover:</span> <br/><strong style={{ color: '#10b981' }}>{business.annualTurnover}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Number of Employees:</span> <br/><strong>{business.numberOfEmployees}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Purpose of Account:</span> <br/><strong>{business.purposeOfAccount}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Fiche Individuelle / Professionnelle</h5>
                  <div className="grid-2" style={{ fontSize: '0.88rem', rowGap: '0.75rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Profession:</span> <br/><strong>{business.profession}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Employer:</span> <br/><strong>{business.employer}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Employment Status:</span> <br/><strong>{business.employmentStatus}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Sector:</span> <br/><strong>{business.sector}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Country of Employment:</span> <br/><strong>{business.countryOfEmployment}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Income:</span> <br/><strong style={{ color: '#10b981' }}>{business.expectedIncome}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Purpose of Account:</span> <br/><strong>{business.purposeOfAccount}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. FINANCIAL TAB ─────────────────────────────── */}
          {activeTab === 'financial' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                FINANCIAL PROFILE (DECLARED BASELINE)
              </h4>

              <div className="grid-2">
                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>Revenus & Origine des Fonds</h5>
                  <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Declared Income:</span> <br/><strong>{financial.declaredIncome}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Declared Turnover:</span> <br/><strong>{financial.declaredTurnover}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Source of Funds:</span> <br/><strong>{financial.sourceOfFunds}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Source of Wealth:</span> <br/><strong>{financial.sourceOfWealth}</strong></div>
                  </div>
                </div>

                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>Flux & Comportements Attendus</h5>
                  <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Monthly Inflow:</span> <br/><strong style={{ color: '#10b981' }}>{financial.expectedMonthlyInflow}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Monthly Outflow:</span> <br/><strong style={{ color: '#f87171' }}>{financial.expectedMonthlyOutflow}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Transaction Volume:</span> <br/><strong>{financial.expectedTransactionVolume}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Expected Transaction Amount:</span> <br/><strong>{financial.expectedTransactionAmount}</strong></div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Cash Activity:</span> <br/><span className="badge warning">{financial.cashActivity}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>International:</span> <br/><span className="badge primary">{financial.internationalActivity}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. UBO TAB ───────────────────────────────────── */}
          {activeTab === 'ubo' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  UBO (ULTIMATE BENEFICIAL OWNERSHIP)
                </h4>
                <span className="badge success">Déclaration UBO: Validée ({ubo.verificationDate})</span>
              </div>

              <div className="card">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Bénéficiaire Effectif</th>
                      <th>Part de détention</th>
                      <th>Nationalité</th>
                      <th>Statut PEP</th>
                      <th>Rôle / Qualité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ubo.beneficialOwners.map((owner, idx) => (
                      <tr key={idx}>
                        <td><strong>{owner.fullName}</strong></td>
                        <td><span className="badge primary" style={{ fontWeight: 700 }}>{owner.percentage}</span></td>
                        <td>{owner.nationality}</td>
                        <td>{owner.isPep ? <span className="badge danger">PEP OUI</span> : <span className="badge neutral">Non</span>}</td>
                        <td>{owner.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. DOCUMENTS TAB ─────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                DOCUMENTS & JUSTIFICATIFS DE CONFORMITÉ
              </h4>

              <div className="card">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Type de Document</th>
                      <th>Référence / N°</th>
                      <th>Statut</th>
                      <th>Date Enregistrement</th>
                      <th>Date Expiration</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, idx) => (
                      <tr key={idx}>
                        <td><strong>{doc.type}</strong></td>
                        <td style={{ fontFamily: 'monospace' }}>{doc.number}</td>
                        <td>
                          <span className={`badge ${doc.status === 'VALID' ? 'success' : doc.status === 'PENDING' ? 'warning' : 'danger'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td>{doc.dateUploaded}</td>
                        <td>{doc.expiryDate}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => alert(`Inspection du document: ${doc.type}`)}>
                            Visualiser
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 6. RISK TAB (KYC RISK ENGINE DIMENSIONS) ─────── */}
          {activeTab === 'risk' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  KYC RISK ENGINE — MULTI-DIMENSIONAL SCORING
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score Global:</span>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: getRiskColor(riskEngine.riskLevel),
                    padding: '0.2rem 0.6rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px'
                  }}>
                    {riskEngine.overallScore}/100 ({riskEngine.riskLevel})
                  </span>
                </div>
              </div>

              {/* Risk Bands Bar (from KYC.PDF Page 7) */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {riskEngine.riskBands.map((band, idx) => (
                  <div key={idx} style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    background: band.active ? band.color : 'rgba(255,255,255,0.04)',
                    color: band.active ? '#fff' : 'var(--text-muted)',
                    textAlign: 'center',
                    border: `1px solid ${band.active ? band.color : 'var(--border-color)'}`,
                    boxShadow: band.active ? `0 0 15px ${band.color}50` : 'none'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{band.range}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{band.label}</div>
                  </div>
                ))}
              </div>

              {/* 8 Dimensions Grid */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h5 style={{ margin: 0, color: '#f1f5f9' }}>Dimensions Risk Score</h5>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pondération configurable par Compliance</span>
                </div>

                <div className="grid-2" style={{ gap: '1.25rem' }}>
                  {Object.entries(riskEngine.dimensions).map(([key, dim]) => (
                    <div key={key} style={{ background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        <span><strong>{dim.label}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dim.weight})</span></span>
                        <span style={{ fontWeight: 700, color: dim.score > 60 ? '#f87171' : dim.score > 30 ? '#fbbf24' : '#34d399' }}>
                          {dim.score}/100
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${dim.score}%`, 
                          background: dim.score > 60 ? '#ef4444' : dim.score > 30 ? '#f59e0b' : '#10b981',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 7. BEHAVIOR TAB (BEHAVIORAL BASELINE) ─────────── */}
          {activeTab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  CUSTOMER BEHAVIORAL BASELINE (HISTORICAL ACTUAL DATA)
                </h4>
                <span className="badge primary">Calculé en continu par RiskVision</span>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>Métriques Transactionnelles Réelles</h5>
                  <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Chiffre d'Affaires Mensuel Observé:</span> <br/><strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{behavior.baselineMonthlyTurnover}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Nombre d'Opérations (90 jours):</span> <br/><strong>{behavior.observedTransactionsCount} transactions</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Pays Actifs dans les Flux:</span> <br/><strong>{behavior.observedCountries.join(' • ')}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Nombre de Tiers / Bénéficiaires Actifs:</span> <br/><strong>{behavior.activeBeneficiariesCount} contreparties distinctes</strong></div>
                  </div>
                </div>

                <div className="card">
                  <h5 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>Distribution par Contrepartie (Activity Engine)</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {behavior.counterpartiesBreakdown.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span>{item.sector}</span>
                          <strong style={{ color: item.percentage > 50 ? '#f87171' : '#cbd5e1' }}>{item.percentage}%</strong>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${item.percentage}%`, 
                            background: item.percentage > 50 ? '#f87171' : '#38bdf8', 
                            borderRadius: '3px' 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h5 style={{ marginTop: '1.25rem', marginBottom: '0.75rem', color: '#f1f5f9' }}>Canaux d'Usage</h5>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {Object.entries(behavior.channelDistribution).map(([ch, val]) => (
                      <div key={ch} style={{ flex: 1, background: 'var(--bg-elevated)', padding: '0.4rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>{ch}</div>
                        <strong>{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 8. CHANGES TAB (DYNAMIC KYC ENGINE & ALERT) ──── */}
          {activeTab === 'changes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  DYNAMIC KYC CHANGE DETECTION & ACTIVITY MISMATCH
                </h4>
                <span className={`badge ${changes.changeScore >= 60 ? 'danger' : 'warning'}`}>
                  Score de Changement : {changes.changeScore}/100
                </span>
              </div>

              {/* 3-Column Comparison: Declared vs Registered vs Observed (Page 9 of PDF) */}
              <div className="grid-3 mb-md" style={{ gap: '1rem' }}>
                <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>A — Declared KYC</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Activité:</strong> {changes.declaredKyc.activity}</div>
                    <div><strong>Turnover:</strong> {changes.declaredKyc.expectedTurnover}</div>
                    <div><strong>Pays:</strong> {changes.declaredKyc.expectedCountries}</div>
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase' }}>B — Registered KYC</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>RC Activité:</strong> {changes.declaredKyc.activity}</div>
                    <div><strong>Statut Légal:</strong> Conforme Enregistrement</div>
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.06)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>C — Observed Profile (RiskVision)</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Actual Turnover:</strong> <span style={{ color: '#f87171', fontWeight: 700 }}>{changes.observedProfile.observedTurnover} ({changes.observedProfile.turnoverChangePercent})</span></div>
                    <div><strong>Contreparties:</strong> {changes.observedProfile.observedActivity}</div>
                    <div><strong>Pays Nouveaux:</strong> {changes.observedProfile.newCountries}</div>
                  </div>
                </div>
              </div>

              {/* Activity Classification & Mismatch Box (Page 12 of PDF) */}
              <div className="card mb-md" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h5 style={{ margin: 0, color: '#fca5a5' }}>
                    Activity Classification Engine (Observation 90 jours)
                  </h5>
                  <span className="badge danger">
                    {changes.activityClassificationEngine.statusText}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Activité Déclarée:</span>
                    <div style={{ fontWeight: 700, color: '#93c5fd' }}>{changes.activityClassificationEngine.declaredActivity}</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>➔</div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Activité Réelle Observée:</span>
                    <div style={{ fontWeight: 700, color: '#f87171' }}>{changes.activityClassificationEngine.observedActivity}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cohérence d'Activité:</span>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.1rem' }}>
                      {changes.activityClassificationEngine.activityConsistencyScore}/100 ({changes.activityClassificationEngine.activityConsistencyLabel})
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Comparison Table (Page 10 of PDF) */}
              <div className="card mb-md">
                <h5 style={{ marginBottom: '0.75rem', color: '#f1f5f9' }}>Tableau Comparatif KYC vs Current Data</h5>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Variable</th>
                      <th>KYC Déclaré</th>
                      <th>Current / Observé</th>
                      <th>Résultat Comparaison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.comparisonTable.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.variable}</strong></td>
                        <td>{row.kycDeclared}</td>
                        <td><strong>{row.observed}</strong></td>
                        <td>
                          <span className={`badge ${row.severity}`}>
                            {row.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* KYC Change Score Breakdown & Send to EWS Button (Page 13, 16, 17 of PDF) */}
              <div className="card" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h5 style={{ margin: 0, color: '#f8fafc' }}>Action: Transmission vers EWS (Early Warning System)</h5>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Le KYC produit des signaux (KYC Signals), l'EWS les consolide avec les fraudes et anomalies.
                    </p>
                  </div>
                  <button 
                    className="btn btn-danger"
                    disabled={ewsSending || ewsSent}
                    onClick={handleSendToEws}
                    style={{ padding: '0.6rem 1.4rem', fontWeight: 700 }}
                  >
                    {ewsSending ? 'Transmission en cours...' : ewsSent ? '✓ Alerte Transmise à EWS' : '🚨 Action ➔ Send to EWS'}
                  </button>
                </div>

                {ewsMessage && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {ewsMessage}
                  </div>
                )}

                <div className="grid-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KYC Change</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{changes.dynamicAlertEws.signals.kycChange}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction Anomaly</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{changes.dynamicAlertEws.signals.transactionAnomaly}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>New Beneficiary Risk</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{changes.dynamicAlertEws.signals.newBeneficiaryRisk}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Geographic Risk</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{changes.dynamicAlertEws.signals.geographicRisk}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 9. HISTORY TAB ───────────────────────────────── */}
          {activeTab === 'history' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                JOURNAL D'AUDIT & HISTORIQUE DES REVUES KYC
              </h4>

              <div className="card">
                <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {history.map((evt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'rgba(59, 130, 246, 0.2)', 
                        color: '#60a5fa', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <strong style={{ color: '#f1f5f9' }}>{evt.action}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Par: {evt.reviewer} • {evt.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ACCOUNTS VARIABLES FOOTER SECTION ("each var in each account") */}
        <div className="accounts-variables-section mt-lg" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f1f5f9' }}>
              💳 Comptes Rattachés & Métriques de Vélocité ({accounts?.length || 0})
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Variables calculées au niveau compte</span>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            {accounts?.map((acc) => (
              <div key={acc.accountId} className="card" style={{ padding: '1rem', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#38bdf8' }}>{acc.numeroCompte}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({acc.typeCompte})</span>
                  </div>
                  <span className={`badge ${acc.alertLevel === 'NORMAL' ? 'success' : 'warning'}`}>{acc.alertLevel}</span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem' }}>
                  {parseFloat(acc.soldeActuel || 0).toLocaleString()} {acc.devise}
                </div>

                <div className="grid-2" style={{ fontSize: '0.8rem', rowGap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Flux Entrant:</span> <strong style={{ color: '#10b981' }}>{acc.inflowMonthly?.toLocaleString()} DA</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Flux Sortant:</span> <strong style={{ color: '#f87171' }}>{acc.outflowMonthly?.toLocaleString()} DA</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tx 30 jours:</span> <strong>{acc.txCount30d} ops</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tx Moyenne:</span> <strong>{acc.averageTxAmount?.toLocaleString()} DA</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Score Risque Compte:</span> <strong style={{ color: acc.accountRiskScore > 60 ? '#ef4444' : '#10b981' }}>{acc.accountRiskScore}/100</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
