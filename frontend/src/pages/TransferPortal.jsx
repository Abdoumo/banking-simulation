import { useState, useEffect } from 'react';
import { getAccounts, makeTransfer, makeDeposit } from '../api';

function formatMoney(val, devise = 'DA') {
  return parseFloat(val || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' ' + devise;
}

export default function TransferPortal() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('transfer'); // 'transfer' | 'deposit'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(false);

  const [transferForm, setTransferForm] = useState({
    from_account_id: '', to_account_number: '', montant: '', description: '',
  });

  const [depositForm, setDepositForm] = useState({
    account_id: '', montant: '', description: '',
  });

  useEffect(() => {
    getAccounts()
      .then(data => {
        setAccounts(data.filter(a => a.status === 'Active'));
        if (data.length > 0) {
          setTransferForm(prev => ({ ...prev, from_account_id: data[0].account_id }));
          setDepositForm(prev => ({ ...prev, account_id: data[0].account_id }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await makeTransfer(transferForm);
      setMessage({ type: 'success', text: `${result.message} — Nouveau solde: ${formatMoney(result.nouveau_solde)}` });
      setTransferForm(prev => ({ ...prev, to_account_number: '', montant: '', description: '' }));
      // Refresh accounts
      const accs = await getAccounts();
      setAccounts(accs.filter(a => a.status === 'Active'));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await makeDeposit(depositForm);
      setMessage({ type: 'success', text: `${result.message} — Nouveau solde: ${formatMoney(result.nouveau_solde)}` });
      setDepositForm(prev => ({ ...prev, montant: '', description: '' }));
      const accs = await getAccounts();
      setAccounts(accs.filter(a => a.status === 'Active'));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const selectedAccount = accounts.find(a => a.account_id === parseInt(transferForm.from_account_id));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Opérations</h1>
        <p className="page-subtitle">Effectuez vos virements et dépôts en toute sécurité</p>
      </div>

      {/* Tabs */}
      <div className="filters-bar mb-lg">
        <button className={`filter-chip ${tab === 'transfer' ? 'active' : ''}`} onClick={() => { setTab('transfer'); setMessage({ type: '', text: '' }); }}>
          💸 Virement
        </button>
        <button className={`filter-chip ${tab === 'deposit' ? 'active' : ''}`} onClick={() => { setTab('deposit'); setMessage({ type: '', text: '' }); }}>
          📥 Dépôt
        </button>
      </div>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏛</div>
            <p className="empty-state-text">Vous n'avez aucun compte actif pour effectuer des opérations</p>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* Form */}
          <div className="card">
            {tab === 'transfer' ? (
              <form onSubmit={handleTransfer}>
                <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Nouveau Virement</h3>
                <div className="form-group">
                  <label className="form-label">Compte émetteur</label>
                  <select className="form-select" value={transferForm.from_account_id}
                    onChange={e => setTransferForm(prev => ({ ...prev, from_account_id: e.target.value }))}>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.numero_compte} ({a.type_compte}) — {formatMoney(a.solde_actuel, a.devise)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Numéro de compte bénéficiaire</label>
                  <input className="form-input font-mono" placeholder="Ex: 1000000000012"
                    value={transferForm.to_account_number}
                    onChange={e => setTransferForm(prev => ({ ...prev, to_account_number: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Montant</label>
                  <input className="form-input" type="number" step="0.01" min="1" placeholder="0.00"
                    value={transferForm.montant}
                    onChange={e => setTransferForm(prev => ({ ...prev, montant: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optionnel)</label>
                  <input className="form-input" placeholder="Motif du virement"
                    value={transferForm.description}
                    onChange={e => setTransferForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={processing}>
                  {processing ? 'Traitement...' : '↗ Effectuer le virement'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleDeposit}>
                <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Nouveau Dépôt</h3>
                <div className="form-group">
                  <label className="form-label">Compte destinataire</label>
                  <select className="form-select" value={depositForm.account_id}
                    onChange={e => setDepositForm(prev => ({ ...prev, account_id: e.target.value }))}>
                    {accounts.map(a => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.numero_compte} ({a.type_compte}) — {formatMoney(a.solde_actuel, a.devise)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Montant</label>
                  <input className="form-input" type="number" step="0.01" min="1" placeholder="0.00"
                    value={depositForm.montant}
                    onChange={e => setDepositForm(prev => ({ ...prev, montant: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optionnel)</label>
                  <input className="form-input" placeholder="Motif du dépôt"
                    value={depositForm.description}
                    onChange={e => setDepositForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={processing}>
                  {processing ? 'Traitement...' : '📥 Effectuer le dépôt'}
                </button>
              </form>
            )}
          </div>

          {/* Account Summary */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Vos comptes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {accounts.map(acc => (
                <div key={acc.account_id} className="account-card" style={{ padding: 'var(--space-md)' }}>
                  <div className="account-type">{acc.type_compte} • {acc.devise}</div>
                  <div className="account-number">{acc.numero_compte}</div>
                  <div className={`account-balance ${parseFloat(acc.solde_actuel) >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.3rem' }}>
                    {formatMoney(acc.solde_actuel, acc.devise === 'EUR' ? '€' : acc.devise === 'USD' ? '$' : 'DA')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
