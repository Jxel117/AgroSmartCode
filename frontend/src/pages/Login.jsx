import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contra, setContra] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(correo, contra);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo iniciar sesion');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-pagina">
      <div className="login-marca">
        <div className="login-marca-contenido">
          <div className="login-logo">AS</div>
          <h1>AgroSmart</h1>
          <p>Monitoreo y control de riego agricola basado en IoT. Decisiones de riego automaticas, en tiempo real.</p>
        </div>
        <div className="login-marca-decoracion" />
      </div>

      <div className="login-formulario-lado">
        <form className="login-formulario" onSubmit={manejarSubmit}>
          <h2>Iniciar sesion</h2>
          <p className="login-ayuda">Ingresa tus credenciales para continuar</p>

          {error && <div className="login-error">{error}</div>}

          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" value={correo} required
              onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
          </div>

          <div className="campo">
            <label htmlFor="contra">Contraseña</label>
            <input id="contra" type="password" value={contra} required
              onChange={(e) => setContra(e.target.value)} placeholder="••••••••" />
          </div>

          <button className="btn btn-primario login-boton" type="submit" disabled={cargando}>
            {cargando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}