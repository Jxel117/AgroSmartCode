import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import { notif } from '../utils/notif.js';
import ReCAPTCHA from 'react-google-recaptcha';
import Campo from '../components/Campo.jsx';
import CampoPassword from '../components/CampoPassword.jsx';
import FondoCarrusel from '../components/FondoCarrusel.jsx';
import './Login.css';

const reglas = {
  correo: (v) => {
    if (!v?.trim()) return 'El correo es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo no válido';
    return null;
  },
  contra: (v) => !v ? 'La contraseña es obligatoria' : null,
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contra, setContra] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [cargando, setCargando] = useState(false);
  const captchaRef = useRef(null);

  const { errores, validar, limpiarError } = useValidacionForm();

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  function setCorreoValue(v) {
    setCorreo(v);
    if (errores.correo) limpiarError('correo');
  }

  function setContraValue(v) {
    setContra(v);
    if (errores.contra) limpiarError('contra');
  }

  async function manejarSubmit(e) {
    e.preventDefault();

    if (!validar({ correo, contra }, reglas)) return;

    if (!captchaToken) {
      notif.formulario.alerta('Por favor completa la verificación de seguridad');
      return;
    }

    setCargando(true);
    try {
      await login(correo, contra, captchaToken);
      navigate('/');
    } catch (err) {
      const mensaje = err.response?.data?.error ?? 'No se pudo iniciar sesión';
      notif.formulario.error(mensaje);
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

        <form onSubmit={manejarSubmit} noValidate>
          <Campo label="Correo" id="correo" error={errores.correo}>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreoValue(e.target.value)}
              placeholder="tu@correo.com"
            />
          </Campo>

          <Campo label="Contraseña" id="contra" error={errores.contra}>
            <CampoPassword
              id="contra"
              value={contra}
              onChange={(e) => setContraValue(e.target.value)}
              sinLabel
            />
          </Campo>

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