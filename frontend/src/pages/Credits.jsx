import { useState, useEffect } from 'react';
import { getCredits, makeCreditPayment, getAccounts } from '../api';

function formatMoney(val, devise = 'DA') {
  return parseFloat(val || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' ' + devise;
}

export default function Credits() {
  const [credits, setCredits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ montant: '', from_account_id: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getCredits(), getAccounts()])
      .then(([creds, accs]) => {
        setCredits(creds);
        setAccounts(accs.filter(a => a.status === 'Active'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await makeCreditPayment(selectedCredit.credit_id, paymentForm);
      setMessage({ type: 'success', text: result.message });
      setSelectedCredit(null);
      fetchData(); // refresh credits and accounts
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Mes Crédits</h1>
        <p className="page-subtitle">Suivez et gérez vos emprunts</p>
      </div>

      {message.text && <div className={`alert alert-${message.type} mb-lg`}>{message.text}</div>}

      {credits.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🏦</div>
          <p className="empty-state-text">Vous n'avez aucun crédit en cours</p>
        </div>
      ) : (
        <div className="grid-2">
          {credits.map(credit => {
            const progress = ((credit.montant_initial - credit.montant_restant) / credit.montant_initial) * 100;
            return (
              <div key={credit.credit_id} className="credit-card">
                <div className="flex-between mb-md">
                  <div>
                    <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>{credit.type_credit}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Lié au compte {credit.account?.numero_compte}
                    </div>
                  </div>
                  <span className={`badge ${credit.status === 'Active' ? 'success' : credit.status === 'Defaulted' ? 'danger' : 'neutral'}`}>
                    {credit.status}
                  </span>
                </div>

                <div className="flex-between mt-lg">
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Montant Emprunté</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(credit.montant_initial)}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restant dû</div>
                    <div style={{ fontWeight: 700, color: 'var(--danger-400)' }}>{formatMoney(credit.montant_restant)}</div>
                  </div>
                </div>

                <div className="credit-progress">
                  <div className="credit-progress-bar">
                    <div className="credit-progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="credit-progress-labels">
                    <span>{progress.toFixed(1)}% remboursé</span>
                    <span>Taux: {credit.taux_interet}%</span>
                  </div>
                </div>

                <div className="grid-2 mt-md" style={{ gap: 'var(--space-sm)' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mensualité</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(credit.mensualite)}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impayés</div>
                    <div style={{ fontWeight: 600, color: credit.nombre_impayes > 0 ? 'var(--danger-400)' : 'var(--text-primary)' }}>
                      {credit.nombre_impayes} ({credit.jours_retard} jrs)
                    </div>
                  </div>
                </div>

                {credit.status === 'Active' && (
                  <button
                    className="btn btn-primary btn-block mt-md"
                    onClick={() => {
                      setSelectedCredit(credit);
                      setPaymentForm({ montant: credit.mensualite, from_account_id: accounts[0]?.account_id || '' });
                      setMessage({ type: '', text: '' });
                    }}
                  >
                    Payer une échéance
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {selectedCredit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCredit(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Payer une échéance — {selectedCredit.type_credit}</h2>
              <button className="modal-close" onClick={() => setSelectedCredit(null)}>✕</button>
            </div>

            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label className="form-label">Compte à débiter</label>
                <select className="form-select" value={paymentForm.from_account_id}
                  onChange={e => setPaymentForm(prev => ({ ...prev, from_account_id: e.target.value }))}>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.numero_compte} — {formatMoney(a.solde_actuel, a.devise)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Montant du paiement</label>
                <input className="form-input" type="number" step="0.01" max={selectedCredit.montant_restant}
                  value={paymentForm.montant}
                  onChange={e => setPaymentForm(prev => ({ ...prev, montant: e.target.value }))}
                  required />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedCredit(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                  {processing ? 'Traitement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
