import { useState, useEffect } from 'react';
import {
  getAdminStats, getAdminClients, getAdminTransactions,
  updateAdminKyc, updateAdminAccount,
  adminCreateCredit, recordMissedPayment
} from '../api';
import KycEngineModal from '../components/KycEngineModal';

function formatMoney(val) {
  return parseFloat(val || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' DA';
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('clients'); // 'stats' | 'clients' | 'transactions'

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');

  // Modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [creditForm, setCreditForm] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [kycEngineClientId, setKycEngineClientId] = useState(null);

  useEffect(() => {
    if (tab === 'stats') {
      getAdminStats().then(setStats).finally(() => setLoading(false));
    } else if (tab === 'clients') {
      setLoading(true);
      getAdminClients(page, 20, search, kycFilter).then(data => {
        setClients(data.clients || []);
        setTotalPages(data.totalPages || 1);
      }).finally(() => setLoading(false));
    } else if (tab === 'transactions') {
      setLoading(true);
      getAdminTransactions(page, 50).then(data => {
        setTransactions(data.transactions || []);
        setTotalPages(data.totalPages || 1);
      }).finally(() => setLoading(false));
    }
  }, [tab, page, search, kycFilter]);

  // Handle KYC verification
  const handleKycStatus = async (clientId, status, reason = '') => {
    try {
      await updateAdminKyc(clientId, { kyc_status: status, rejection_reason: reason });
      alert(`Statut KYC mis à jour : ${status}`);
      // Refresh row
      setClients(prev => prev.map(c => c.client_id === clientId ? { ...c, kyc: { ...c.kyc, kyc_status: status } } : c));
    } catch (err) {
      alert(err.message);
    }
  };

  // Assign Credit from Admin
  const handleCreateCredit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await adminCreateCredit(creditForm);
      alert('Crédit accordé avec succès');
      setCreditForm(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Mark missed payment
  const handleMissedPayment = async (creditId) => {
    if (!window.confirm("Déclarer un impayé pour ce crédit ?")) return;
    try {
      await recordMissedPayment(creditId, { jours_retard_ajoutes: 30 });
      alert('Impayé enregistré');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Panneau d'Administration</h1>
        <p className="page-subtitle">Gestion de la banque (Contrôle total sur les 10,000+ clients simulés)</p>
      </div>

      <div className="filters-bar mb-lg">
        <button className={`filter-chip ${tab === 'stats' ? 'active' : ''}`} onClick={() => { setTab('stats'); setPage(1); }}>📊 Statistiques</button>
        <button className={`filter-chip ${tab === 'clients' ? 'active' : ''}`} onClick={() => { setTab('clients'); setPage(1); }}>👥 Base Clients (10k+)</button>
        <button className={`filter-chip ${tab === 'transactions' ? 'active' : ''}`} onClick={() => { setTab('transactions'); setPage(1); }}>💸 Ledger Global</button>
      </div>

      {loading ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <>
          {/* STATS TAB */}
          {tab === 'stats' && stats && (
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Total Clients</div>
                <div className="card-value">{stats.clients.total.toLocaleString()}</div>
              </div>
              <div className="card">
                <div className="card-title">Total Comptes</div>
                <div className="card-value">{stats.accounts.total.toLocaleString()}</div>
                <div className="stat-trend up">Encours: {formatMoney(stats.accounts.totalBalance)}</div>
              </div>
              <div className="card">
                <div className="card-title">Crédits (Actifs)</div>
                <div className="card-value">{stats.credits.active.toLocaleString()}</div>
                <div className="stat-trend down">Restant dû: {formatMoney(stats.credits.totalOutstanding)}</div>
                <div className="mt-sm" style={{ fontSize: '0.75rem', color: 'var(--danger-400)' }}>
                  En défaut : {stats.credits.defaulted.toLocaleString()}
                </div>
              </div>
              <div className="card">
                <div className="card-title">Transactions (Ledger)</div>
                <div className="card-value">{stats.transactions.total.toLocaleString()}</div>
              </div>
              <div className="card">
                <div className="card-title">KYC Vérifiés</div>
                <div className="card-value" style={{ color: 'var(--accent-400)' }}>{stats.kyc.verified.toLocaleString()}</div>
              </div>
              <div className="card">
                <div className="card-title">KYC Rejetés</div>
                <div className="card-value" style={{ color: 'var(--danger-400)' }}>{stats.kyc.rejected.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {tab === 'clients' && (
            <div className="table-container">
              <div className="table-header">
                <div className="search-bar" style={{ width: '300px' }}>
                  <span className="search-bar-icon">🔍</span>
                  <input placeholder="Rechercher nom, email..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setPage(1)} />
                </div>
                <select className="form-select" style={{ width: '200px', background: 'var(--bg-input)' }}
                  value={kycFilter} onChange={e => { setKycFilter(e.target.value); setPage(1); }}>
                  <option value="">Tous les statuts KYC</option>
                  <option value="Verified">Vérifiés</option>
                  <option value="Pending">En attente</option>
                  <option value="Rejected">Rejetés</option>
                </select>
              </div>

              {/* Spotlight Banner for KYC Engine (from KYC.PDF) */}
              <div style={{
                background: 'linear-gradient(90deg, rgba(37,99,235,0.18) 0%, rgba(30,41,59,0.8) 100%)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: '10px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>1/ KYC ENGINE</span>
                    <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Customer Identity & Dynamic Risk Profile</strong>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Architecture 9 Tabs : Baseline + Surveillance Continue + Classification d'Activité (Cas C-001245).
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setKycEngineClientId(1245)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  ⭐ Inspecter Client Démo (C-001245)
                </button>
              </div>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Client</th>
                      <th>Type</th>
                      <th>KYC & Risque</th>
                      <th>Dynamic KYC</th>
                      <th>Comptes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.client_id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                            {c.customer_id || `C-${String(c.client_id).padStart(6, '0')}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                        </td>
                        <td>{c.type_client}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className={`badge ${c.kyc?.kyc_status === 'Verified' ? 'success' : c.kyc?.kyc_status === 'Rejected' ? 'danger' : 'warning'}`}>
                              {c.kyc?.kyc_status || 'En attente'}
                            </span>
                            {c.kyc_score !== undefined && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                                {c.kyc_score}/100
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {c.change_score >= 60 ? (
                            <span className="badge danger" style={{ fontSize: '0.72rem' }}>
                              ⚠️ Alerte ({c.change_score})
                            </span>
                          ) : (
                            <span className="badge success" style={{ fontSize: '0.72rem' }}>
                              ✓ Stable
                            </span>
                          )}
                        </td>
                        <td>{c.accounts?.length || 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => setKycEngineClientId(c.client_id)}
                              title="Ouvrir le KYC Engine 360° complet"
                            >
                              🔍 KYC 360°
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedClient(c)}>
                              Gérer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
                <span className="pagination-info">Page {page} sur {totalPages}</span>
                <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {tab === 'transactions' && (
            <div className="table-container">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opération</th>
                      <th>Émetteur</th>
                      <th>Bénéficiaire</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.transaction_id}>
                        <td>{formatDate(tx.date)}</td>
                        <td>
                          <span className="badge neutral">{tx.type_operation}</span>
                        </td>
                        <td>
                          {tx.emetteur ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{tx.emetteur.client?.prenom} {tx.emetteur.client?.nom}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.emetteur.numero_compte}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          {tx.beneficiaire ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{tx.beneficiaire.client?.prenom} {tx.beneficiaire.client?.nom}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.beneficiaire.numero_compte}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatMoney(tx.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
                <span className="pagination-info">Page {page} sur {totalPages}</span>
                <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Client Management Modal */}
      {selectedClient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedClient(null); }}>
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Gérer le client : {selectedClient.prenom} {selectedClient.nom}</h2>
              <button className="modal-close" onClick={() => setSelectedClient(null)}>✕</button>
            </div>

            <div className="grid-2">
              {/* KYC Control */}
              <div className="card">
                <h3 className="card-title mb-md">Vérification KYC</h3>
                <div style={{ fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                  <div><strong>Profession:</strong> {selectedClient.kyc?.profession || '-'}</div>
                  <div><strong>Revenu:</strong> {selectedClient.kyc?.revenu_mensuel ? formatMoney(selectedClient.kyc.revenu_mensuel) : '-'}</div>
                  <div><strong>Adresse:</strong> {selectedClient.kyc?.adresse_postale || '-'}</div>
                  <div className="mt-sm">
                    <strong>Statut Actuel:</strong> <span className="badge neutral">{selectedClient.kyc?.kyc_status}</span>
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-sm btn-primary" onClick={() => handleKycStatus(selectedClient.client_id, 'Verified')}>Approuver</button>
                  <button className="btn btn-sm btn-danger" onClick={() => {
                    const reason = prompt("Motif du rejet :");
                    if (reason) handleKycStatus(selectedClient.client_id, 'Rejected', reason);
                  }}>Rejeter</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setKycEngineClientId(selectedClient.client_id)}>
                    🔍 Ouvrir KYC 360°
                  </button>
                </div>
              </div>

              {/* Accounts */}
              <div className="card">
                <h3 className="card-title mb-md">Comptes ({selectedClient.accounts?.length})</h3>
                {selectedClient.accounts?.map(acc => (
                  <div key={acc.account_id} style={{ padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                    <div className="flex-between">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{acc.numero_compte}</span>
                      <span className={`badge ${acc.status === 'Active' ? 'success' : 'danger'}`}>{acc.status}</span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatMoney(acc.solde_actuel)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credits Control */}
            <div className="card mt-md">
              <div className="flex-between mb-md">
                <h3 className="card-title">Crédits en cours</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setCreditForm({
                  client_id: selectedClient.client_id, account_id: selectedClient.accounts?.[0]?.account_id,
                  type_credit: 'Credit Consommation', montant_initial: '', taux_interet: '5', duree_mois: '12'
                })}>
                  + Accorder un crédit
                </button>
              </div>

              {selectedClient.credits?.map(cred => (
                <div key={cred.credit_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cred.type_credit}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restant: {formatMoney(cred.montant_restant)}</div>
                  </div>
                  <div className="flex gap-sm align-center">
                    <span className="badge warning">Impayés: {cred.nombre_impayes}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => handleMissedPayment(cred.credit_id)}>Déclarer Impayé</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Credit Modal */}
      {creditForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCreditForm(null); }}>
          <div className="modal-content">
            <h2 className="modal-title mb-lg">Accorder un Crédit (Admin)</h2>
            <form onSubmit={handleCreateCredit}>
              <div className="form-group">
                <label className="form-label">Compte destinataire</label>
                <select className="form-select" value={creditForm.account_id}
                  onChange={e => setCreditForm({ ...creditForm, account_id: e.target.value })}>
                  {selectedClient?.accounts?.map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.numero_compte}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type de crédit</label>
                <select className="form-select" value={creditForm.type_credit}
                  onChange={e => setCreditForm({ ...creditForm, type_credit: e.target.value })}>
                  <option value="Credit Consommation">Crédit Consommation</option>
                  <option value="Credit Immobilier">Crédit Immobilier</option>
                  <option value="Credit Auto">Crédit Auto</option>
                  <option value="Credit Professionnel">Crédit Professionnel</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Montant du crédit</label>
                <input className="form-input" type="number" required
                  value={creditForm.montant_initial}
                  onChange={e => setCreditForm({ ...creditForm, montant_initial: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Taux d'intérêt (%)</label>
                  <input className="form-input" type="number" step="0.1" required
                    value={creditForm.taux_interet}
                    onChange={e => setCreditForm({ ...creditForm, taux_interet: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Durée (mois)</label>
                  <input className="form-input" type="number" required
                    value={creditForm.duree_mois}
                    onChange={e => setCreditForm({ ...creditForm, duree_mois: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-sm mt-md">
                <button type="button" className="btn btn-secondary" onClick={() => setCreditForm(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={processing}>Confirmer le crédit</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* KYC Engine 360 Modal */}
      {kycEngineClientId && (
        <KycEngineModal 
          clientId={kycEngineClientId} 
          onClose={() => setKycEngineClientId(null)} 
        />
      )}
    </div>
  );
}
