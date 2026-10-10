import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const initials = user ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase() : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">RV</div>
          <span className="sidebar-logo-text">RiskVision</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Espace Client</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">📊</span>
          Tableau de bord
        </NavLink>
        <NavLink to="/kyc" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">🪪</span>
          Vérification KYC
        </NavLink>
        <NavLink to="/transfer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">💸</span>
          Virements
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">📜</span>
          Historique
        </NavLink>
        <NavLink to="/credits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">🏦</span>
          Mes Crédits
        </NavLink>

        {user?.is_admin && (
          <>
            <div className="sidebar-section-label">Administration</div>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-link-icon">⚙️</span>
              Panel Admin
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.prenom} {user?.nom}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          ⎋ Déconnexion
        </button>
      </div>
    </aside>
  );
}
