import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notif } from '../utils/notif.js';
import { authApi } from '../api/endpoints.js';
import MedidorPassword from '../components/MedidorPassword.jsx';
import CampoPassword from '../components/CampoPassword.jsx';
import FondoCarrusel from '../components/FondoCarrusel.jsx';
import './Login.css';

export default function ActivarCuenta({ modo = 'recuperar' }) {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [datosToken, setDatosToken] = useState(null);
  const [errorVerif, setErrorVerif] = useState('');

  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirma, setPasswordConfirma] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    async function verificar() {
      try {
        const { data } = await authApi.verificarToken(token);
        if (data.valido) {
          setTokenValido(true);
          setDatosToken(data);
        } else {
          setErrorVerif(
            data.motivo === 'EXPIRADO' ? 'El enlace expiró. Solicita uno nuevo desde el inicio de sesión.' :
              data.motivo === 'YA_USADO' ? 'Este enlace ya fue utilizado. Si necesitas otro, solicítalo desde "¿Olvidaste tu contraseña?".' :
                'El enlace no es válido.'
          );
        }
      } catch {
        setErrorVerif('No se pudo verificar el enlace. Intenta nuevamente.');
      } finally {
        setVerificando(false);
      }
    }
    verificar();
  }, [token]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (passwordNueva !== passwordConfirma) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setGuardando(true);
    try {
      await authApi.completarRecuperacion(token, passwordNueva);
      setExito(true);
      notif.formulario.exito('Contraseña configurada correctamente');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setError(detalles.map((d) => d.mensaje).join('. '));
      } else {
        const mensaje = err.response?.data?.error ?? 'No se pudo guardar la contraseña';
        setError(mensaje);
        notif.formulario.error(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  }

  const subtitulo = modo === 'activar'
    ? 'Activa tu cuenta para empezar a regar inteligente'
    : 'Crea una nueva contraseña segura';

  const textoBoton = modo === 'activar' ? 'Activar mi cuenta' : 'Restablecer contraseña';

  return (
    <div className="login-pagina">
      <FondoCarrusel />

      <div className="login-tarjeta">
        <div className="login-encabezado">
          <img className="login-logo" src="/agrosmart.svg" alt="AgroSmart" />
          <h1 className="login-marca-titulo">AgroSmart</h1>
          <p className="login-marca-subtitulo">{subtitulo}</p>
        </div>

        {verificando ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <span className="spinner" />
            <p style={{ marginTop: '1rem', color: 'var(--gris-500)', fontSize: '0.9rem' }}>
              Verificando enlace...
            </p>
          </div>
        ) : !tokenValido ? (
          <>
            <div className="login-error" style={{ marginBottom: '1.2rem' }}>{errorVerif}</div>
            <Link to="/olvidar-password" className="btn btn-primario login-boton"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Solicitar nuevo enlace
            </Link>
            <div className="login-enlaces">
              <Link to="/login">Volver al inicio de sesión</Link>
            </div>
          </>
        ) : exito ? (
          <div style={{
            background: 'var(--verde-50, #f1f9ed)',
            border: '1px solid var(--verde-300, #9cd494)',
            color: 'var(--verde-700)',
            padding: '1.2rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>¡Listo!</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.6rem' }}>
              Tu contraseña ha sido configurada correctamente.
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--gris-500)' }}>
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <div style={{
              background: 'rgba(247, 245, 239, 0.6)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.2rem',
              fontSize: '0.86rem',
            }}>
              Hola <strong>{datosToken.nombre}</strong>. Tu correo de acceso será:<br />
              <strong style={{ color: 'var(--verde-700)' }}>{datosToken.correo}</strong>
            </div>

            {error && <div className="login-error">{error}</div>}

            <CampoPassword
              id="passNueva"
              label="Nueva contraseña"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              autoFocus
            />
            <MedidorPassword password={passwordNueva} />

            <CampoPassword
              id="passConf"
              label="Confirmar contraseña"
              value={passwordConfirma}
              onChange={(e) => setPasswordConfirma(e.target.value)}
            />
            {passwordConfirma && passwordNueva !== passwordConfirma && (
              <span style={{
                fontSize: '0.78rem',
                color: 'var(--rojo, #b91c1c)',
                marginTop: '-0.7rem',
                display: 'block',
                marginBottom: '1rem',
              }}>
                Las contraseñas no coinciden
              </span>
            )}

            <button className="btn btn-primario login-boton" type="submit" disabled={guardando}>
              {guardando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : textoBoton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}