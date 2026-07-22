import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { notif } from '../utils/notif.js';
import { authApi } from '../api/endpoints.js';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Campo from '../components/Campo.jsx';
import CampoConIcono from '../components/CampoConIcono.jsx';

const reglas = {
  correo: (v) => {
    if (!v?.trim()) return 'El correo es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo no válido';
    return null;
  },
};

export default function OlvidarPassword() {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const { errores, validar, limpiarError } = useValidacionForm();

  async function enviar(e) {
    e.preventDefault();
    if (!validar({ correo }, reglas)) return;
    setEnviando(true);
    setError('');
    try {
      await authApi.solicitarRecuperacion(correo);
      setEnviado(true);
      notif.formulario.exito('Solicitud recibida. Revisa tu correo.');
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setError(detalles.map((d) => d.mensaje).join('. '));
      } else {
        const mensaje = err.response?.data?.error ?? 'No se pudo procesar la solicitud';
        setError(mensaje);
        notif.formulario.error(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  }

  function setCorreoValue(v) {
    setCorreo(v);
    if (errores.correo) limpiarError('correo');
  }

  return (
    <AuthLayout titulo="Recupera tu contraseña" subtitulo="Te ayudamos a recuperar el acceso a tu cuenta">
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
        <form onSubmit={enviar} noValidate>
          {error && <div className="login-error">{error}</div>}

          <p style={{ fontSize: '0.88rem', color: 'var(--gris-700)', marginBottom: '1.2rem', textAlign: 'center', lineHeight: 1.5 }}>
            Te enviaremos un enlace a tu correo Gmail para que puedas crear una nueva contraseña de forma segura.
          </p>

          <Campo label="Correo Gmail de validación" id="correo" error={errores.correo}>
            <CampoConIcono icono={Mail}>
              <input id="correo" type="email" value={correo}
                onChange={(e) => setCorreoValue(e.target.value)}
                placeholder="tucorreo@gmail.com" autoFocus />
            </CampoConIcono>
          </Campo>

          <button className="btn btn-primario login-boton" type="submit" disabled={enviando}>
            {enviando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Enviar enlace'}
          </button>

          <div className="login-enlaces">
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}