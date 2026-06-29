import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';

function LoginScreen({ onLogin }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!token.trim()) return;
    const ok = onLogin(token.trim());
    if (!ok) {
      setError('Token inválido, expirado, o no es de un administrador.');
    }
  };

  return (
    <div className="auth-screen">
      <div className="card auth-card">
        {}
        <div style={{ marginBottom: '1.5rem' }}>
          <img
            src="/logo_agrosmart_planta.svg"
            alt="AgroSmart"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <h2>Panel de Auditoría</h2>
        <p>
          Ingresa tu token JWT de administrador de AgroSmart para acceder al
          panel de auditoría.
        </p>
        <input
          type="text"
          placeholder="Pega aquí tu token JWT..."
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {error && (
          <p style={{ color: 'var(--rojo)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary" onClick={handleSubmit}>
          Acceder
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}
