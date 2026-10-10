import { useState, useEffect } from 'react';
import { getTransactions, getAccounts } from '../api';

function formatMoney(val, devise = 'DA') {
  return parseFloat(val || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' ' + devise;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([getTransactions(page, 20), getAccounts()])
      .then(([txData, accData]) => {
        setTransactions(txData.transactions || []);
        setTotalPages(txData.totalPages || 1);
        setAccounts(accData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const userAccountIds = accounts.map(a => a.account_id);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Historique des transactions</h1>
        <p className="page-subtitle">Consultez l'ensemble de vos mouvements financiers</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Dernières opérations</h2>
        </div>

        {loading ? (
          <div className="loader-container"><div className="loader"></div></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p className="empty-state-text">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Compte Impacté</th>
                  <th className="text-right">Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const isOutflow = userAccountIds.includes(tx.compte_emetteur);
                  let accountText = '-';
                  if (isOutflow && tx.emetteur) {
                    accountText = `${tx.emetteur.type_compte} (${tx.emetteur.numero_compte.slice(-4)})`;
                  } else if (!isOutflow && tx.beneficiaire) {
                    accountText = `${tx.beneficiaire.type_compte} (${tx.beneficiaire.numero_compte.slice(-4)})`;
                  }

                  return (
                    <tr key={tx.transaction_id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>{tx.description}</td>
                      <td>
                        <span className={`badge ${isOutflow ? 'danger' : 'success'}`}>
                          {isOutflow ? '↗' : '↙'} {tx.type_operation}
                        </span>
                      </td>
                      <td>{accountText}</td>
                      <td className="text-right" style={{ fontWeight: 600, color: isOutflow ? 'var(--danger-400)' : 'var(--accent-400)' }}>
                        {isOutflow ? '-' : '+'}{formatMoney(tx.montant, tx.devise)}
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
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </button>
            <span className="pagination-info">Page {page} sur {totalPages}</span>
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
