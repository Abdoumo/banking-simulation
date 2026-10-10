import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', type_client: 'Particulier' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRegister(form);
      loginUser(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">RV</div>
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">Rejoignez RiskVision en quelques secondes</p>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nom">Nom</label>
              <input id="reg-nom" className="form-input" placeholder="Nom" value={form.nom} onChange={e => update('nom', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-prenom">Prénom</label>
              <input id="reg-prenom" className="form-input" placeholder="Prénom" value={form.prenom} onChange={e => update('prenom', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Adresse email</label>
            <input id="reg-email" className="form-input" type="email" placeholder="votre@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Mot de passe</label>
            <input id="reg-password" className="form-input" type="password" placeholder="Minimum 6 caractères" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-type">Type de client</label>
            <select id="reg-type" className="form-select" value={form.type_client} onChange={e => update('type_client', e.target.value)}>
              <option value="Particulier">Particulier</option>
              <option value="Professionnel">Professionnel</option>
              <option value="PME/Entreprise">PME / Entreprise</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-footer">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
