import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/endpoints.js';
import FondoCarrusel from '../components/FondoCarrusel.jsx';
import './Login.css';

export default function OlvidarPassword() {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await authApi.solicitarRecuperacion(correo);
      setEnviado(true);
      toast.success('Solicitud recibida. Revisa tu correo.');
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setError(detalles.map((d) => d.mensaje).join('. '));
      } else {
        setError(err.response?.data?.error ?? 'No se pudo procesar la solicitud');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-pagina">
      <FondoCarrusel />

      <div className="login-tarjeta">
        <div className="login-encabezado">
          <img className="login-logo" src="/agrosmart.svg" alt="AgroSmart" />
          <h1 className="login-marca-titulo">AgroSmart</h1>
          <p className="login-marca-subtitulo">Recupera el acceso a tu cuenta</p>
        </div>

        {enviado ? (
          <>
            <div style={{
              background: 'var(--verde-50, #f1f9ed)',
              border: '1px solid var(--verde-300, #9cd494)',
              color: 'var(--verde-700)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}>
              <strong>Solicitud recibida.</strong><br />
              Si el correo está registrado, recibirás un enlace de recuperación en breve.
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gris-500)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Revisa tu bandeja de entrada y la carpeta de spam. El enlace es válido durante 1 hora.
            </p>
            <Link to="/login" className="btn btn-primario login-boton" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <form onSubmit={enviar}>
            {error && <div className="login-error">{error}</div>}

            <p style={{ fontSize: '0.88rem', color: 'var(--gris-700)', marginBottom: '1.2rem', textAlign: 'center', lineHeight: 1.5 }}>
              Te enviaremos un enlace a tu correo Gmail para que puedas crear una nueva contraseña de forma segura.
            </p>

            <div className="campo">
              <label htmlFor="correo">Correo Gmail de validación</label>
              <input id="correo" type="email" value={correo} required
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@gmail.com" autoFocus />
            </div>

            <button className="btn btn-primario login-boton" type="submit" disabled={enviando}>
              {enviando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Enviar enlace'}
            </button>

            <div className="login-enlaces">
              <Link to="/login">Volver al inicio de sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}