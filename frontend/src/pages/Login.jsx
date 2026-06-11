import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ReCAPTCHA from 'react-google-recaptcha';
import CampoPassword from '../components/CampoPassword.jsx';
import FondoCarrusel from '../components/FondoCarrusel.jsx';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contra, setContra] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const captchaRef = useRef(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Por favor completa la verificación de seguridad');
      return;
    }

    setCargando(true);
    try {
      await login(correo, contra, captchaToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo iniciar sesion');
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-pagina">
      <FondoCarrusel />

      <div className="login-tarjeta">
        <div className="login-encabezado">
          <img className="login-logo" src="/agrosmart.svg" alt="AgroSmart" />
          <h1 className="login-marca-titulo">AgroSmart</h1>
          <p className="login-marca-subtitulo">Riego inteligente basado en IoT</p>
        </div>

        <form onSubmit={manejarSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" value={correo} required
              onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
          </div>

          <CampoPassword
            id="contra"
            label="Contraseña"
            value={contra}
            onChange={(e) => setContra(e.target.value)}
          />

          <div className="login-captcha">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={siteKey}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          <button className="btn btn-primario login-boton" type="submit" disabled={cargando || !captchaToken}>
            {cargando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Entrar'}
          </button>

          <div className="login-enlaces">
            <Link to="/olvidar-password">¿Olvidaste tu contraseña?</Link>
            <span className="login-enlaces-secundario">
              ¿Eres dueño de una finca?{' '}
              <Link to="/registrar-empresa">Registra tu empresa</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}