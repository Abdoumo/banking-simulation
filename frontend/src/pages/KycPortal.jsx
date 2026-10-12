import { useState, useEffect } from 'react';
import { getKyc, updateKyc } from '../api';
import KycEngineModal from '../components/KycEngineModal';

export default function KycPortal() {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [engineTargetId, setEngineTargetId] = useState(null);

  const [form, setForm] = useState({
    profession: '', revenu_mensuel: '', adresse_postale: '',
    doc_identite_type: 'Carte Nationale', doc_identite_numero: '',
    doc_identite_uploaded: false,
    justificatif_domicile_uploaded: false,
    justificatif_revenu_uploaded: false,
    declaration_ubo_uploaded: false,
  });

  useEffect(() => {
    getKyc()
      .then(data => {
        setKyc(data);
        setForm({
          profession: data.profession || '',
          revenu_mensuel: data.revenu_mensuel || '',
          adresse_postale: data.adresse_postale || '',
          doc_identite_type: data.doc_identite_type || 'Carte Nationale',
          doc_identite_numero: data.doc_identite_numero || '',
          doc_identite_uploaded: data.doc_identite_uploaded || false,
          justificatif_domicile_uploaded: data.justificatif_domicile_uploaded || false,
          justificatif_revenu_uploaded: data.justificatif_revenu_uploaded || false,
          declaration_ubo_uploaded: data.declaration_ubo_uploaded || false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await updateKyc(form);
      setKyc(result.kyc);
      setMessage({ type: 'success', text: 'KYC mis à jour avec succès !' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const statusBadge = (status) => {
    if (status === 'Verified') return <span className="badge success">✓ Vérifié</span>;
    if (status === 'Rejected') return <span className="badge danger">✗ Rejeté</span>;
    return <span className="badge warning">⏳ En attente</span>;
  };

  const steps = [
    { label: 'Pièce d\'identité', done: form.doc_identite_uploaded },
    { label: 'Justif. domicile', done: form.justificatif_domicile_uploaded },
    { label: 'Justif. revenu', done: form.justificatif_revenu_uploaded },
    { label: 'Infos personnelles', done: form.profession && form.adresse_postale },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>1/ KYC ENGINE</span>
              <h1 className="page-title" style={{ margin: 0 }}>Vérification & Profil KYC</h1>
            </div>
            <p className="page-subtitle">Complétez vos informations et visualisez votre profil de risque 360°</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setEngineTargetId(kyc?.client_id || 1); setShowEngineModal(true); }}
            >
              🔍 Mon Profil KYC 360°
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => { setEngineTargetId(1245); setShowEngineModal(true); }}
            >
              ⭐ Cas PDF (C-001245)
            </button>
            {kyc && statusBadge(kyc.kyc_status)}
          </div>
        </div>
      </div>

      {kyc?.kyc_status === 'Rejected' && kyc.rejection_reason && (
        <div className="alert alert-error">
          ⚠ Motif du rejet : {kyc.rejection_reason}
        </div>
      )}

      {/* Document Steps */}
      <div className="kyc-steps">
        {steps.map((step, i) => (
          <div key={i} className={`kyc-step ${step.done ? 'done' : 'pending'}`}>
            <div className="kyc-step-icon">{step.done ? '✓' : (i + 1)}</div>
            <span className="kyc-step-label">{step.label}</span>
          </div>
        ))}
      </div>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Informations Personnelles</h3>
            <div className="form-group">
              <label className="form-label">Profession</label>
              <input className="form-input" value={form.profession} onChange={e => update('profession', e.target.value)} placeholder="Ex: Ingénieur" />
            </div>
            <div className="form-group">
              <label className="form-label">Revenu mensuel (DA)</label>
              <input className="form-input" type="number" value={form.revenu_mensuel} onChange={e => update('revenu_mensuel', e.target.value)} placeholder="Ex: 80000" />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse postale</label>
              <textarea className="form-textarea" value={form.adresse_postale} onChange={e => update('adresse_postale', e.target.value)} placeholder="Adresse complète" />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Documents</h3>
            <div className="form-group">
              <label className="form-label">Type de pièce d'identité</label>
              <select className="form-select" value={form.doc_identite_type} onChange={e => update('doc_identite_type', e.target.value)}>
                <option value="Carte Nationale">Carte Nationale</option>
                <option value="Passeport">Passeport</option>
                <option value="Permis de Conduire">Permis de Conduire</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N° de document</label>
              <input className="form-input" value={form.doc_identite_numero} onChange={e => update('doc_identite_numero', e.target.value)} placeholder="Numéro du document" />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.doc_identite_uploaded} onChange={e => update('doc_identite_uploaded', e.target.checked)} />
                Pièce d'identité téléversée
              </label>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.justificatif_domicile_uploaded} onChange={e => update('justificatif_domicile_uploaded', e.target.checked)} />
                Justificatif de domicile téléversé
              </label>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.justificatif_revenu_uploaded} onChange={e => update('justificatif_revenu_uploaded', e.target.checked)} />
                Justificatif de revenu téléversé
              </label>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.declaration_ubo_uploaded} onChange={e => update('declaration_ubo_uploaded', e.target.checked)} />
                Déclaration UBO (Entreprises)
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : '💾 Sauvegarder les modifications'}
          </button>
        </div>
      </form>

      {/* KYC Engine 360 Modal */}
      {showEngineModal && (
        <KycEngineModal 
          clientId={engineTargetId || kyc?.client_id || 1245} 
          onClose={() => setShowEngineModal(false)} 
        />
      )}
    </div>
  );
}
