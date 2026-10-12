import { useState, useEffect } from 'react';
import { getKycEngine, updateKycEngine, sendKycToEws } from '../api';

export default function KycEngineModal({ clientId = 1245, onClose, onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
    setSaveSuccess(false);
    getKycEngine(id)
      .then(data => {
        setProfile(data);
        setFormData(JSON.parse(JSON.stringify(data)));
      })
      .catch(err => {
        console.error('Failed to load KYC engine profile:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await updateKycEngine(currentId, formData);
      setProfile(res.profile || formData);
      setSaveSuccess(true);
      setEditMode(false);
      if (onUpdated) onUpdated(res.profile || formData);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Erreur lors de la sauvegarde du profil : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendToEws = async () => {
    setEwsSending(true);
    try {
      const res = await sendKycToEws(currentId);
      setEwsSent(true);
      setEwsMessage(res.message || 'Alerte transmise avec succès au moteur EWS !');
    } catch (err) {
      alert('Erreur lors de la transmission à EWS : ' + err.message);
    } finally {
      setEwsSending(false);
    }
  };

  const updateNested = (path, value) => {
    setFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const addUbo = () => {
    setFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.tabs.ubo.beneficialOwners) copy.tabs.ubo.beneficialOwners = [];
      copy.tabs.ubo.beneficialOwners.push({
        fullName: 'Nouveau Bénéficiaire',
        percentage: '20%',
        nationality: 'Algérienne',
        isPep: false,
        role: 'Associé',
      });
      return copy;
    });
  };

  const removeUbo = (index) => {
    setFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.tabs.ubo.beneficialOwners.splice(index, 1);
      return copy;
    });
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
        <div className="modal-content" style={{ maxWidth: '900px', textAlign: 'center', padding: '3rem', borderTop: '4px solid #006233' }}>
          <div className="loader" style={{ borderColor: '#006233', borderTopColor: '#d21034' }}></div>
          <p style={{ marginTop: '1rem', color: '#cbd5e1', fontWeight: 600 }}>
            Chargement du moteur KYC & Profil 360°... 🇩🇿
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const activeData = editMode ? formData : profile;
  const { summary, tabs: dataTabs, accounts } = activeData;
  const { identity, business, financial, ubo, documents, riskEngine, behavior, changes, history } = dataTabs;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content kyc-engine-modal dz-theme" style={{ 
        maxWidth: '1080px', 
        maxHeight: '94vh', 
        overflowY: 'auto',
        background: '#0a0f18',
        border: '1px solid rgba(0, 98, 51, 0.4)',
        boxShadow: '0 20px 60px rgba(0, 98, 51, 0.2), 0 0 40px rgba(210, 16, 52, 0.15)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        
        {/* ALGERIAN NATIONAL STRIPE BAR (Green - White - Red) */}
        <div style={{
          height: '5px',
          background: 'linear-gradient(90deg, #006233 0%, #006233 45%, #ffffff 45%, #ffffff 55%, #d21034 55%, #d21034 100%)',
          margin: '-1.5rem -1.5rem 1.25rem -1.5rem',
          borderRadius: '16px 16px 0 0'
        }}></div>

        {/* TOP HEADER */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ 
                background: '#006233',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                letterSpacing: '0.05em',
                boxShadow: '0 0 10px rgba(0,98,51,0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                🇩🇿 1/ KYC ENGINE
              </span>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff', fontWeight: 800 }}>
                Customer Identity & Risk Profile
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              الجمهورية الجزائرية الديمقراطية الشعبية — Système National de Vigilance & Surveillance Bancaire RiskVision
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* CRUD Edit Button */}
            <button 
              className="btn btn-sm"
              onClick={() => {
                if (editMode) {
                  setFormData(JSON.parse(JSON.stringify(profile)));
                  setEditMode(false);
                } else {
                  setEditMode(true);
                }
              }}
              style={{
                background: editMode ? '#d21034' : 'linear-gradient(135deg, #006233, #059669)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: editMode ? '0 0 12px rgba(210,16,52,0.4)' : '0 0 12px rgba(0,98,51,0.4)',
                padding: '0.45rem 0.85rem'
              }}
            >
              {editMode ? '✕ Annuler Édition' : '✏️ Mode Édition (CRUD) 🇩🇿'}
            </button>

            {editMode && (
              <button 
                className="btn btn-sm"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  boxShadow: '0 0 15px rgba(16,185,129,0.5)',
                  padding: '0.45rem 1rem'
                }}
              >
                {saving ? 'Sauvegarde...' : '💾 Enregistrer (Save)'}
              </button>
            )}

            {currentId !== 1245 && !editMode && (
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setCurrentId(1245)}
                title="Charger l'exemple du PDF (C-001245)"
                style={{ borderColor: '#006233', color: '#10b981' }}
              >
                ⭐ Cas PDF (C-001245)
              </button>
            )}

            <button className="modal-close" onClick={onClose} style={{ color: '#ffffff' }}>✕</button>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {saveSuccess && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(0,98,51,0.9), rgba(5,150,105,0.9))',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 20px rgba(0,98,51,0.4)',
            border: '1px solid #10b981'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🇩🇿 ✓</span>
            <div>
              <strong>Succès (CRUD) :</strong> Le profil KYC et les informations bancaires ont été mis à jour et persistés dans le système !
            </div>
          </div>
        )}

        {/* CUSTOMER PROFILE HEADER CARD (Algerian Green & Ruby Accents) */}
        <div className="customer-profile-card mt-md" style={{
          background: 'linear-gradient(135deg, rgba(0, 98, 51, 0.18) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(210, 16, 52, 0.12) 100%)',
          border: '1px solid rgba(0, 98, 51, 0.45)',
          borderRadius: '12px',
          padding: '1.25rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', fontWeight: 700 }}>
                  🇩🇿 CUSTOMER PROFILE (DOSSIER CLIENT)
                </span>
                {editMode && (
                  <span style={{ background: '#d21034', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    ÉDITION EN COURS
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Customer ID: <span style={{ color: '#10b981' }}>{summary.customerId}</span>
                </h3>
                <span className="badge success" style={{ background: '#006233', color: '#ffffff', border: '1px solid #10b981' }}>
                  {summary.status}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '0.92rem' }}>
                <strong>{summary.clientName}</strong> • {summary.clientType}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>KYC STATUS</span>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  {summary.kycStatus.toUpperCase()}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>RISK LEVEL</span>
                <span style={{ color: summary.riskLevel === 'CRITICAL' || summary.riskLevel === 'HIGH' ? '#d21034' : '#10b981', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: summary.riskLevel === 'CRITICAL' || summary.riskLevel === 'HIGH' ? '#d21034' : '#10b981', display: 'inline-block' }}></span>
                  {summary.riskLevel}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label" style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>KYC SCORE</span>
                <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.25rem' }}>
                  {summary.kycScore}<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/100</span>
                </span>
              </div>
              <div className="metric-box" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.25rem' }}>
                <span className="metric-label" style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Last KYC Review</span>
                <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>{summary.lastKycReview}</span>
                <span className="metric-label" style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>Next: {summary.nextReview}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Change Alert Banner */}
          {changes.profileChangeDetected && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(90deg, rgba(210, 16, 52, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(210, 16, 52, 0.5)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.3rem', color: '#d21034' }}>🚨</span>
                <div>
                  <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>KYC PROFILE CHANGE DETECTED: {changes.changeStatus}</strong>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    Score de changement: <strong style={{ color: '#f87171' }}>{changes.changeScore}/100</strong> • Déviation d'activité & anomalie de flux observée
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-sm"
                onClick={() => setActiveTab('changes')}
                style={{ background: '#d21034', color: '#ffffff', border: 'none', padding: '0.35rem 0.85rem', fontWeight: 700 }}
              >
                Inspecter Mismatch ➔
              </button>
            </div>
          )}
        </div>

        {/* 9 NAVIGATION TABS */}
        <div className="tabs-nav mt-md" style={{ 
          display: 'flex', 
          gap: '0.35rem', 
          borderBottom: '2px solid rgba(0, 98, 51, 0.4)', 
          overflowX: 'auto',
          paddingBottom: '0.25rem' 
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? 'linear-gradient(180deg, rgba(0, 98, 51, 0.25) 0%, rgba(0, 98, 51, 0.1) 100%)' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #10b981' : '3px solid transparent',
                padding: '0.65rem 0.95rem',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 800 : 600,
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              [{tab.label}]
            </button>
          ))}
        </div>

        {/* TAB BODY (READ & CRUD EDIT FORMS) */}
        <div className="tab-body mt-md" style={{ minHeight: '380px' }}>
          
          {/* ── 1. IDENTITY TAB ──────────────────────────────── */}
          {activeTab === 'identity' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  IDENTITY PROFILE & BIOMETRIC VERIFICATION 🇩🇿
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span className="badge success" style={{ background: '#006233', color: '#fff' }}>Identity: {identity.identityVerification}</span>
                  <span className="badge success" style={{ background: '#006233', color: '#fff' }}>Document: {identity.documentStatus}</span>
                </div>
              </div>

              <div className="grid-2">
                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Informations Personnelles</h5>
                  
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Nom et Prénom</label>
                        <input className="form-input" value={identity.fullName} onChange={e => updateNested('tabs.identity.fullName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date de Naissance</label>
                        <input className="form-input" type="date" value={identity.dateOfBirth} onChange={e => updateNested('tabs.identity.dateOfBirth', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nationalité</label>
                        <input className="form-input" value={identity.nationality} onChange={e => updateNested('tabs.identity.nationality', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Adresse de Résidence</label>
                        <input className="form-input" value={identity.address} onChange={e => updateNested('tabs.identity.address', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <input className="form-input" value={identity.phone} onChange={e => updateNested('tabs.identity.phone', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" value={identity.email} onChange={e => updateNested('tabs.identity.email', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="info-list" style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Customer ID:</span> <strong style={{ color: '#10b981' }}>{identity.customerId}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Full Name:</span> <strong style={{ color: '#ffffff' }}>{identity.fullName}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Date of Birth:</span> <strong>{identity.dateOfBirth}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Nationality:</span> <strong>{identity.nationality}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Residence:</span> <strong>{identity.countryOfResidence}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Address:</span> <strong>{identity.address}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Phone:</span> <strong>{identity.phone}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Email:</span> <strong>{identity.email}</strong></div>
                    </div>
                  )}
                </div>

                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Pièce d'Identité</h5>
                  
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Type de Document</label>
                        <select className="form-select" value={identity.identificationDocument.documentType} onChange={e => updateNested('tabs.identity.identificationDocument.documentType', e.target.value)}>
                          <option value="Carte Nationale">Carte Nationale (CNI)</option>
                          <option value="Passeport">Passeport</option>
                          <option value="Permis de Conduire">Permis de Conduire</option>
                          <option value="Registre de Commerce + CNI Gérant">Registre de Commerce + CNI Gérant</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Numéro de Document</label>
                        <input className="form-input" value={identity.identificationDocument.documentNumber} onChange={e => updateNested('tabs.identity.identificationDocument.documentNumber', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date d'Émission</label>
                        <input className="form-input" value={identity.identificationDocument.issueDate} onChange={e => updateNested('tabs.identity.identificationDocument.issueDate', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date d'Expiration</label>
                        <input className="form-input" value={identity.identificationDocument.expiryDate} onChange={e => updateNested('tabs.identity.identificationDocument.expiryDate', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="info-list" style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Document Type:</span> <strong style={{ color: '#ffffff' }}>{identity.identificationDocument.documentType}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Document Number:</span> <strong style={{ fontFamily: 'monospace' }}>{identity.identificationDocument.documentNumber}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Issue Date:</span> <strong>{identity.identificationDocument.issueDate}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Expiry Date:</span> <strong>{identity.identificationDocument.expiryDate}</strong></div>
                      <div><span style={{ color: '#94a3b8', width: '150px', display: 'inline-block' }}>Statut Document:</span> <span className="badge success" style={{ background: '#006233', color: '#fff' }}>{identity.identificationDocument.verificationStatus}</span></div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0, 98, 51, 0.12)', borderRadius: '8px', border: '1px solid rgba(0, 98, 51, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>🇩🇿 Authentification CNI biométrique algérienne validée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. BUSINESS TAB ──────────────────────────────── */}
          {activeTab === 'business' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  BUSINESS / PROFESSIONAL PROFILE ({business.profileType})
                </h4>
                {editMode && (
                  <button className="btn btn-sm btn-secondary" onClick={() => updateNested('tabs.business.profileType', business.profileType === 'Company' ? 'Individual' : 'Company')}>
                    Basculer type: {business.profileType === 'Company' ? 'Vers Individuel' : 'Vers Société'}
                  </button>
                )}
              </div>

              <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                {editMode ? (
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    {business.profileType === 'Company' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Raison Sociale (Legal Name)</label>
                          <input className="form-input" value={business.legalName} onChange={e => updateNested('tabs.business.legalName', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Forme Juridique (SARL, SPA, EURL)</label>
                          <input className="form-input" value={business.legalForm} onChange={e => updateNested('tabs.business.legalForm', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">N° Registre de Commerce / NIF</label>
                          <input className="form-input" value={business.registrationNumber} onChange={e => updateNested('tabs.business.registrationNumber', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Activité Commerciale Déclarée</label>
                          <input className="form-input" value={business.businessActivity} onChange={e => updateNested('tabs.business.businessActivity', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Chiffre d'Affaires Annuel</label>
                          <input className="form-input" value={business.annualTurnover} onChange={e => updateNested('tabs.business.annualTurnover', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Nombre d'Employés</label>
                          <input className="form-input" type="number" value={business.numberOfEmployees} onChange={e => updateNested('tabs.business.numberOfEmployees', e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">Profession</label>
                          <input className="form-input" value={business.profession} onChange={e => updateNested('tabs.business.profession', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Employeur</label>
                          <input className="form-input" value={business.employer} onChange={e => updateNested('tabs.business.employer', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Secteur</label>
                          <input className="form-input" value={business.sector} onChange={e => updateNested('tabs.business.sector', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Revenu Attendu Mensuel</label>
                          <input className="form-input" value={business.expectedIncome} onChange={e => updateNested('tabs.business.expectedIncome', e.target.value)} />
                        </div>
                      </>
                    )}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Objet du Compte (Purpose of Account)</label>
                      <input className="form-input" value={business.purposeOfAccount} onChange={e => updateNested('tabs.business.purposeOfAccount', e.target.value)} />
                    </div>
                  </div>
                ) : (
                  business.profileType === 'Company' ? (
                    <div className="grid-2" style={{ fontSize: '0.88rem', rowGap: '0.85rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Legal Name:</span> <br/><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{business.legalName}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Legal Form:</span> <br/><strong>{business.legalForm}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Registration Number:</span> <br/><strong style={{ fontFamily: 'monospace' }}>{business.registrationNumber}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Business Activity:</span> <br/><strong style={{ color: '#10b981' }}>{business.businessActivity}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Sector:</span> <br/><strong>{business.sector}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Country of Incorporation:</span> <br/><strong>{business.countryOfIncorporation}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Countries of Operation:</span> <br/><strong>{Array.isArray(business.countriesOfOperation) ? business.countriesOfOperation.join(', ') : business.countriesOfOperation}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Annual Turnover:</span> <br/><strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{business.annualTurnover}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Number of Employees:</span> <br/><strong>{business.numberOfEmployees}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Purpose of Account:</span> <br/><strong>{business.purposeOfAccount}</strong></div>
                    </div>
                  ) : (
                    <div className="grid-2" style={{ fontSize: '0.88rem', rowGap: '0.85rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Profession:</span> <br/><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{business.profession}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Employer:</span> <br/><strong>{business.employer}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Employment Status:</span> <br/><strong>{business.employmentStatus}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Sector:</span> <br/><strong>{business.sector}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Expected Income:</span> <br/><strong style={{ color: '#10b981' }}>{business.expectedIncome}</strong></div>
                      <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94a3b8' }}>Purpose of Account:</span> <br/><strong>{business.purposeOfAccount}</strong></div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ── 3. FINANCIAL TAB ─────────────────────────────── */}
          {activeTab === 'financial' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                FINANCIAL PROFILE & CASH FLOW ESTIMATES 🇩🇿
              </h4>

              <div className="grid-2">
                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Revenus Déclarés</h5>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Revenu Déclaré (DA/mois)</label>
                        <input className="form-input" value={financial.declaredIncome} onChange={e => updateNested('tabs.financial.declaredIncome', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Chiffre d'Affaires Déclaré</label>
                        <input className="form-input" value={financial.declaredTurnover} onChange={e => updateNested('tabs.financial.declaredTurnover', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Source des Fonds</label>
                        <input className="form-input" value={financial.sourceOfFunds} onChange={e => updateNested('tabs.financial.sourceOfFunds', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Source du Patrimoine</label>
                        <input className="form-input" value={financial.sourceOfWealth} onChange={e => updateNested('tabs.financial.sourceOfWealth', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Declared Income:</span> <br/><strong style={{ color: '#ffffff' }}>{financial.declaredIncome}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Declared Turnover:</span> <br/><strong style={{ color: '#10b981' }}>{financial.declaredTurnover}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Source of Funds:</span> <br/><strong>{financial.sourceOfFunds}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Source of Wealth:</span> <br/><strong>{financial.sourceOfWealth}</strong></div>
                    </div>
                  )}
                </div>

                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Flux Attendus & Vélocité</h5>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Flux Entrant Attendu (Inflow)</label>
                        <input className="form-input" value={financial.expectedMonthlyInflow} onChange={e => updateNested('tabs.financial.expectedMonthlyInflow', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Flux Sortant Attendu (Outflow)</label>
                        <input className="form-input" value={financial.expectedMonthlyOutflow} onChange={e => updateNested('tabs.financial.expectedMonthlyOutflow', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Volume de Transactions</label>
                        <input className="form-input" value={financial.expectedTransactionVolume} onChange={e => updateNested('tabs.financial.expectedTransactionVolume', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Activité Espèces (Cash Activity)</label>
                        <select className="form-select" value={financial.cashActivity} onChange={e => updateNested('tabs.financial.cashActivity', e.target.value)}>
                          <option value="Low">Low (Faible)</option>
                          <option value="Medium">Medium (Moyen)</option>
                          <option value="High">High (Élevé)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>Expected Monthly Inflow:</span> <br/><strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{financial.expectedMonthlyInflow}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Expected Monthly Outflow:</span> <br/><strong style={{ color: '#f87171', fontSize: '1.05rem' }}>{financial.expectedMonthlyOutflow}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Expected Transaction Volume:</span> <br/><strong>{financial.expectedTransactionVolume}</strong></div>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                        <div><span style={{ color: '#94a3b8' }}>Cash Activity:</span> <br/><span className="badge warning">{financial.cashActivity}</span></div>
                        <div><span style={{ color: '#94a3b8' }}>International:</span> <br/><span className="badge primary" style={{ background: '#006233', color: '#fff' }}>{financial.internationalActivity}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. UBO TAB (CRUD ON BENEFICIAL OWNERS) ────────── */}
          {activeTab === 'ubo' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  UBO (ULTIMATE BENEFICIAL OWNERSHIP) 🇩🇿
                </h4>
                {editMode && (
                  <button className="btn btn-sm btn-primary" onClick={addUbo} style={{ background: '#006233', border: 'none' }}>
                    + Ajouter un UBO
                  </button>
                )}
              </div>

              <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Bénéficiaire Effectif</th>
                      <th>Part de détention</th>
                      <th>Nationalité</th>
                      <th>Statut PEP</th>
                      <th>Rôle / Fonction</th>
                      {editMode && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ubo.beneficialOwners.map((owner, idx) => (
                      <tr key={idx}>
                        <td>
                          {editMode ? (
                            <input className="form-input" style={{ padding: '0.3rem' }} value={owner.fullName} onChange={e => {
                              const copy = [...ubo.beneficialOwners];
                              copy[idx].fullName = e.target.value;
                              updateNested('tabs.ubo.beneficialOwners', copy);
                            }} />
                          ) : (
                            <strong style={{ color: '#ffffff' }}>{owner.fullName}</strong>
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input className="form-input" style={{ width: '80px', padding: '0.3rem' }} value={owner.percentage} onChange={e => {
                              const copy = [...ubo.beneficialOwners];
                              copy[idx].percentage = e.target.value;
                              updateNested('tabs.ubo.beneficialOwners', copy);
                            }} />
                          ) : (
                            <span className="badge primary" style={{ background: '#006233', color: '#fff', fontWeight: 800 }}>{owner.percentage}</span>
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input className="form-input" style={{ width: '120px', padding: '0.3rem' }} value={owner.nationality} onChange={e => {
                              const copy = [...ubo.beneficialOwners];
                              copy[idx].nationality = e.target.value;
                              updateNested('tabs.ubo.beneficialOwners', copy);
                            }} />
                          ) : (
                            owner.nationality
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <select className="form-select" style={{ padding: '0.3rem' }} value={owner.isPep ? 'yes' : 'no'} onChange={e => {
                              const copy = [...ubo.beneficialOwners];
                              copy[idx].isPep = e.target.value === 'yes';
                              updateNested('tabs.ubo.beneficialOwners', copy);
                            }}>
                              <option value="no">Non</option>
                              <option value="yes">PEP OUI</option>
                            </select>
                          ) : (
                            owner.isPep ? <span className="badge danger">PEP OUI</span> : <span className="badge neutral">Non</span>
                          )}
                        </td>
                        <td>
                          {editMode ? (
                            <input className="form-input" style={{ padding: '0.3rem' }} value={owner.role} onChange={e => {
                              const copy = [...ubo.beneficialOwners];
                              copy[idx].role = e.target.value;
                              updateNested('tabs.ubo.beneficialOwners', copy);
                            }} />
                          ) : (
                            owner.role
                          )}
                        </td>
                        {editMode && (
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={() => removeUbo(idx)}>
                              🗑️
                            </button>
                          </td>
                        )}
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
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                DOCUMENTS & CONFORMITÉ LÉGALE 🇩🇿
              </h4>

              <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Référence</th>
                      <th>Statut</th>
                      <th>Date Enregistrement</th>
                      <th>Expiration</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: '#ffffff' }}>{doc.type}</strong></td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {editMode ? (
                            <input className="form-input" style={{ padding: '0.3rem' }} value={doc.number} onChange={e => {
                              const copy = [...documents];
                              copy[idx].number = e.target.value;
                              updateNested('tabs.documents', copy);
                            }} />
                          ) : doc.number}
                        </td>
                        <td>
                          {editMode ? (
                            <select className="form-select" style={{ padding: '0.3rem' }} value={doc.status} onChange={e => {
                              const copy = [...documents];
                              copy[idx].status = e.target.value;
                              updateNested('tabs.documents', copy);
                            }}>
                              <option value="VALID">VALID (Validé)</option>
                              <option value="PENDING">PENDING (En attente)</option>
                              <option value="MISSING">MISSING (Manquant)</option>
                            </select>
                          ) : (
                            <span className={`badge ${doc.status === 'VALID' ? 'success' : doc.status === 'PENDING' ? 'warning' : 'danger'}`}
                              style={doc.status === 'VALID' ? { background: '#006233', color: '#fff' } : {}}
                            >
                              {doc.status}
                            </span>
                          )}
                        </td>
                        <td>{doc.dateUploaded}</td>
                        <td>{doc.expiryDate}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => alert(`Visualisation du document : ${doc.type}`)}>
                            Aperçu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 6. RISK TAB ──────────────────────────────────── */}
          {activeTab === 'risk' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  KYC RISK ENGINE — MULTI-DIMENSIONAL SCORING 🇩🇿
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Score Global :</span>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 900, 
                    color: '#ffffff',
                    padding: '0.2rem 0.75rem',
                    background: riskEngine.overallScore > 60 ? '#d21034' : '#006233',
                    borderRadius: '6px'
                  }}>
                    {riskEngine.overallScore}/100 ({riskEngine.riskLevel})
                  </span>
                </div>
              </div>

              {/* Algerian Risk Bands Bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {riskEngine.riskBands.map((band, idx) => (
                  <div key={idx} style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    background: band.active ? (band.label === 'LOW' ? '#006233' : band.label === 'MEDIUM' ? '#d97706' : '#d21034') : 'rgba(255,255,255,0.04)',
                    color: band.active ? '#ffffff' : '#94a3b8',
                    textAlign: 'center',
                    border: `1px solid ${band.active ? '#ffffff' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: band.active ? '0 0 15px rgba(255,255,255,0.2)' : 'none'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{band.range}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{band.label}</div>
                  </div>
                ))}
              </div>

              {/* Dimensions Grid */}
              <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid-2" style={{ gap: '1.25rem' }}>
                  {Object.entries(riskEngine.dimensions).map(([key, dim]) => (
                    <div key={key} style={{ background: '#111c2e', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        <span><strong style={{ color: '#ffffff' }}>{dim.label}</strong> <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({dim.weight})</span></span>
                        {editMode ? (
                          <input 
                            type="number" 
                            style={{ width: '60px', padding: '0.1rem 0.3rem', background: '#0a0f18', color: '#10b981', border: '1px solid #006233', borderRadius: '4px' }}
                            value={dim.score}
                            onChange={e => updateNested(`tabs.riskEngine.dimensions.${key}.score`, parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, color: dim.score > 60 ? '#f87171' : dim.score > 30 ? '#fbbf24' : '#10b981' }}>
                            {dim.score}/100
                          </span>
                        )}
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${dim.score}%`, 
                          background: dim.score > 60 ? '#d21034' : dim.score > 30 ? '#f59e0b' : '#006233',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 7. BEHAVIOR TAB ──────────────────────────────── */}
          {activeTab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  CUSTOMER BEHAVIORAL BASELINE (HISTORICAL DATA) 🇩🇿
                </h4>
                <span className="badge primary" style={{ background: '#006233', color: '#fff' }}>Surveillance Continue</span>
              </div>

              <div className="grid-2">
                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Métriques Réelles Observées</h5>
                  <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div><span style={{ color: '#94a3b8' }}>Chiffre d'Affaires Mensuel Observé :</span> <br/><strong style={{ fontSize: '1.15rem', color: '#10b981' }}>{behavior.baselineMonthlyTurnover}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Nombre d'Opérations (90 jours) :</span> <br/><strong style={{ color: '#ffffff' }}>{behavior.observedTransactionsCount} transactions</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Pays Actifs dans les Flux :</span> <br/><strong style={{ color: '#ffffff' }}>{behavior.observedCountries.join(' • ')}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Bénéficiaires Distincts :</span> <br/><strong style={{ color: '#ffffff' }}>{behavior.activeBeneficiariesCount} contreparties</strong></div>
                  </div>
                </div>

                <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ marginBottom: '1rem', color: '#ffffff', fontWeight: 700 }}>Distribution par Secteur de Contrepartie</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {behavior.counterpartiesBreakdown.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#cbd5e1' }}>{item.sector}</span>
                          <strong style={{ color: item.percentage > 50 ? '#f87171' : '#10b981' }}>{item.percentage}%</strong>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${item.percentage}%`, 
                            background: item.percentage > 50 ? '#d21034' : '#006233', 
                            borderRadius: '3px' 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 8. CHANGES TAB (DYNAMIC ALERT & EWS) ─────────── */}
          {activeTab === 'changes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#d21034', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                  DYNAMIC KYC CHANGE DETECTION & ACTIVITY MISMATCH 🚨
                </h4>
                <span className="badge danger" style={{ background: '#d21034', color: '#ffffff', fontWeight: 800 }}>
                  Score de Changement : {changes.changeScore}/100
                </span>
              </div>

              {/* 3-Column Comparison */}
              <div className="grid-3 mb-md" style={{ gap: '1rem' }}>
                <div className="card" style={{ background: '#0d1522', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>A — DECLARED KYC</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Activité:</strong> {changes.declaredKyc.activity}</div>
                    <div><strong>Turnover:</strong> {changes.declaredKyc.expectedTurnover}</div>
                    <div><strong>Pays:</strong> {changes.declaredKyc.expectedCountries}</div>
                  </div>
                </div>

                <div className="card" style={{ background: '#0d1522', borderLeft: '4px solid #ffffff' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 800 }}>B — REGISTERED KYC (RC)</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>RC Activité:</strong> {changes.declaredKyc.activity}</div>
                    <div><strong>Statut Légal:</strong> Conforme Enregistrement</div>
                  </div>
                </div>

                <div className="card" style={{ background: 'rgba(210,16,52,0.1)', borderLeft: '4px solid #d21034', border: '1px solid rgba(210,16,52,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 800 }}>C — OBSERVED PROFILE (RISKVISION)</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Actual Turnover:</strong> <span style={{ color: '#f87171', fontWeight: 800 }}>{changes.observedProfile.observedTurnover} ({changes.observedProfile.turnoverChangePercent})</span></div>
                    <div><strong>Contreparties:</strong> {changes.observedProfile.observedActivity}</div>
                    <div><strong>Nouveaux Pays:</strong> {changes.observedProfile.newCountries}</div>
                  </div>
                </div>
              </div>

              {/* Activity Mismatch Card */}
              <div className="card mb-md" style={{ border: '1px solid rgba(210,16,52,0.4)', background: 'rgba(210,16,52,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h5 style={{ margin: 0, color: '#f87171', fontWeight: 800 }}>Activity Classification Engine (Observation 90 jours)</h5>
                  <span className="badge danger" style={{ background: '#d21034', color: '#fff' }}>ACTIVITY MISMATCH</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Activité Déclarée:</span>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{changes.activityClassificationEngine.declaredActivity}</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', color: '#94a3b8' }}>➔</div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Activité Réelle:</span>
                    <div style={{ fontWeight: 800, color: '#f87171' }}>{changes.activityClassificationEngine.observedActivity}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cohérence d'Activité:</span>
                    <div style={{ fontWeight: 900, color: '#d21034', fontSize: '1.2rem' }}>
                      {changes.activityClassificationEngine.activityConsistencyScore}/100 (LOW)
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Send to EWS */}
              <div className="card" style={{ background: 'linear-gradient(180deg, #162032 0%, #0d1522 100%)', border: '1px solid rgba(210,16,52,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h5 style={{ margin: 0, color: '#ffffff', fontWeight: 800 }}>Action : Transmission vers EWS (Early Warning System)</h5>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                      Transmission des signaux de déviation pour alimenter la matrice nationale de fraude.
                    </p>
                  </div>
                  <button 
                    className="btn"
                    disabled={ewsSending || ewsSent}
                    onClick={handleSendToEws}
                    style={{ background: '#d21034', color: '#ffffff', padding: '0.65rem 1.4rem', fontWeight: 800, border: 'none', boxShadow: '0 0 15px rgba(210,16,52,0.4)' }}
                  >
                    {ewsSending ? 'Transmission...' : ewsSent ? '✓ Alerte Transmise à EWS' : '🚨 Action ➔ Send to EWS'}
                  </button>
                </div>

                {ewsMessage && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem', background: '#006233', color: '#ffffff', border: 'none' }}>
                    🇩🇿 {ewsMessage}
                  </div>
                )}

                <div className="grid-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #d21034' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>KYC Change</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>{changes.dynamicAlertEws.signals.kycChange}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #d21034' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transaction Anomaly</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>{changes.dynamicAlertEws.signals.transactionAnomaly}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #10b981' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>New Beneficiary Risk</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{changes.dynamicAlertEws.signals.newBeneficiaryRisk}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #ffffff' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Geographic Risk</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>{changes.dynamicAlertEws.signals.geographicRisk}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 9. HISTORY TAB ───────────────────────────────── */}
          {activeTab === 'history' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', color: '#10b981', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                JOURNAL D'AUDIT & HISTORIQUE DES REVUES 🇩🇿
              </h4>

              <div className="card" style={{ background: '#0d1522', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {history.map((evt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: idx === 0 ? '#006233' : 'rgba(255,255,255,0.1)', 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <strong style={{ color: '#ffffff' }}>{evt.action}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{evt.date}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                          Par : {evt.reviewer} • {evt.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ACCOUNTS VARIABLES FOOTER SECTION */}
        <div className="accounts-variables-section mt-lg" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 800 }}>
              💳 Comptes Rattachés & Vélocité Bancaire ({accounts?.length || 0}) 🇩🇿
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Variables par compte</span>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            {accounts?.map((acc) => (
              <div key={acc.accountId} className="card" style={{ padding: '1rem', background: '#0d1522', border: '1px solid rgba(0, 98, 51, 0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>{acc.numeroCompte}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem' }}>({acc.typeCompte})</span>
                  </div>
                  <span className="badge" style={{ 
                    background: acc.alertLevel === 'NORMAL' ? '#006233' : '#d21034', 
                    color: '#ffffff',
                    fontWeight: 700
                  }}>
                    {acc.alertLevel}
                  </span>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.75rem' }}>
                  {parseFloat(acc.soldeActuel || 0).toLocaleString()} {acc.devise}
                </div>

                <div className="grid-2" style={{ fontSize: '0.8rem', rowGap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Flux Entrant:</span> <strong style={{ color: '#10b981' }}>{acc.inflowMonthly?.toLocaleString()} DA</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Flux Sortant:</span> <strong style={{ color: '#f87171' }}>{acc.outflowMonthly?.toLocaleString()} DA</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Tx 30 jours:</span> <strong>{acc.txCount30d} ops</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Tx Moyenne:</span> <strong>{acc.averageTxAmount?.toLocaleString()} DA</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#94a3b8' }}>Score Risque Compte:</span> <strong style={{ color: acc.accountRiskScore > 60 ? '#d21034' : '#10b981' }}>{acc.accountRiskScore}/100</strong>
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
