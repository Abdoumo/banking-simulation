import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccounts, getTransactions, getCredits } from '../api';

function formatMoney(val, devise = 'DZD') {
  const num = parseFloat(val) || 0;
  return num.toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' ' + devise;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAccounts(), getTransactions(1, 8), getCredits()])
      .then(([accs, txs, creds]) => {
        setAccounts(accs);
        setTransactions(txs.transactions || []);
        setCredits(creds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const totalDZD = accounts.filter(a => a.devise === 'DZD').reduce((s, a) => s + parseFloat(a.solde_actuel || 0), 0);
  const totalEUR = accounts.filter(a => a.devise === 'EUR').reduce((s, a) => s + parseFloat(a.solde_actuel || 0), 0);
  const totalUSD = accounts.filter(a => a.devise === 'USD').reduce((s, a) => s + parseFloat(a.solde_actuel || 0), 0);
  const activeCredits = credits.filter(c => c.status === 'Active');
  const totalCreditDebt = activeCredits.reduce((s, c) => s + parseFloat(c.montant_restant || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Bonjour, {user?.prenom} 👋</h1>
        <p className="page-subtitle">Voici un aperçu de vos finances</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Solde Total (DZD)</span>
            <div className="card-icon primary">💰</div>
          </div>
          <div className={`card-value ${totalDZD >= 0 ? '' : 'account-balance negative'}`}>
            {formatMoney(totalDZD, 'DA')}
          </div>
          <span className={`stat-trend ${totalDZD >= 0 ? 'up' : 'down'}`}>
            {totalDZD >= 0 ? '▲' : '▼'} {accounts.filter(a => a.devise === 'DZD').length} compte(s)
          </span>
        </div>

        {totalEUR > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Solde Total (EUR)</span>
              <div className="card-icon success">€</div>
            </div>
            <div className="card-value">{formatMoney(totalEUR, '€')}</div>
          </div>
        )}

        {totalUSD > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Solde Total (USD)</span>
              <div className="card-icon success">$</div>
            </div>
            <div className="card-value">{formatMoney(totalUSD, '$')}</div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Comptes Actifs</span>
            <div className="card-icon primary">🏛</div>
          </div>
          <div className="card-value">{accounts.filter(a => a.status === 'Active').length}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Crédits en cours</span>
            <div className="card-icon warning">📋</div>
          </div>
          <div className="card-value">{activeCredits.length}</div>
          {totalCreditDebt > 0 && (
            <span className="stat-trend down">Restant: {formatMoney(totalCreditDebt, 'DA')}</span>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Accounts */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Mes Comptes</h2>
          {accounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏛</div>
              <p className="empty-state-text">Aucun compte trouvé</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {accounts.map(acc => (
                <div key={acc.account_id} className="account-card">
                  <div className="flex-between">
                    <div>
                      <div className="account-type">{acc.type_compte} • {acc.devise}</div>
                      <div className="account-number">{acc.numero_compte}</div>
                    </div>
                    <span className={`badge ${acc.status === 'Active' ? 'success' : acc.status === 'Suspended' ? 'danger' : 'neutral'}`}>
                      {acc.status}
                    </span>
                  </div>
                  <div className={`account-balance ${parseFloat(acc.solde_actuel) >= 0 ? 'positive' : 'negative'}`}>
                    {formatMoney(acc.solde_actuel, acc.devise === 'EUR' ? '€' : acc.devise === 'USD' ? '$' : 'DA')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Dernières Opérations</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <p className="empty-state-text">Aucune transaction récente</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const userAccountIds = accounts.map(a => a.account_id);
                      const isOutflow = userAccountIds.includes(tx.compte_emetteur);
                      return (
                        <tr key={tx.transaction_id}>
                          <td>{formatDate(tx.date)}</td>
                          <td>
                            <span className={`badge ${isOutflow ? 'danger' : 'success'}`}>
                              {isOutflow ? '↗' : '↙'} {tx.type_operation}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: isOutflow ? 'var(--danger-400)' : 'var(--accent-400)' }}>
                            {isOutflow ? '-' : '+'}{formatMoney(tx.montant, tx.devise === 'EUR' ? '€' : 'DA')}
                          </td>
                          <td>
                            <span className={`badge ${tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'danger'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
