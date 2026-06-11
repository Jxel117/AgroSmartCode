import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/endpoints.js';
import FondoCarrusel from '../components/FondoCarrusel.jsx';
import './Login.css';

export default function RegistrarEmpresa() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', correoValidacion: '', empresaIdentificador: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  function traducirCampo(campo) {
    const traducciones = {
      nombre: 'Nombre',
      apellido: 'Apellido',
      correoValidacion: 'Correo Gmail',
      empresaIdentificador: 'Empresa',
    };
    return traducciones[campo] ?? campo;
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const { data } = await authApi.registrarEmpresa(form);
      setExito(data);
      toast.success('Empresa registrada correctamente');
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setError(detalles.map((d) => `• ${traducirCampo(d.campo)}: ${d.mensaje}`).join('\n'));
      } else {
        setError(err.response?.data?.error ?? 'No se pudo registrar');
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
          <p className="login-marca-subtitulo">Registra tu finca y empieza a regar inteligente</p>
        </div>

        {exito ? (
          <>
            <div style={{
              background: 'var(--verde-50, #f1f9ed)',
              border: '1px solid var(--verde-300, #9cd494)',
              color: 'var(--verde-700)',
              padding: '1.2rem',
              borderRadius: '12px',
              marginBottom: '1.2rem',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>¡Empresa registrada!</p>
              <p style={{ fontSize: '0.88rem', marginBottom: '0.7rem' }}>
                Enviamos un enlace de activación a:<br />
                <strong>{exito.correoValidacion}</strong>
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Tu correo de acceso será:<br />
                <strong>{exito.correoInstitucional}</strong>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--gris-500)', marginTop: '0.8rem' }}>
                Revisa tu bandeja de entrada y spam. Enlace válido por 1 hora.
              </p>
            </div>
            <Link to="/login" className="btn btn-primario login-boton" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <form onSubmit={enviar}>
            {error && <div className="login-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

            <div className="campo">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={form.nombre} required
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="apellido">Apellido</label>
              <input id="apellido" value={form.apellido} required
                onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            </div>

            <div className="campo">
              <label htmlFor="correoVal">Correo Gmail de validación</label>
              <input id="correoVal" type="email" value={form.correoValidacion} required
                onChange={(e) => setForm({ ...form, correoValidacion: e.target.value })}
                placeholder="tucorreo@gmail.com" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Aquí enviaremos el enlace para activar tu cuenta. Solo @gmail.com.
              </span>
            </div>

            <div className="campo">
              <label htmlFor="empresa">Nombre de tu empresa o finca</label>
              <input id="empresa" value={form.empresaIdentificador} required
                onChange={(e) => setForm({ ...form, empresaIdentificador: e.target.value })}
                placeholder="Ej: Finca Monterey" />
              <span style={{ fontSize: '0.74rem', color: 'var(--gris-500)' }}>
                Identifica tu empresa. Tus agricultores estarán asociados a este nombre.
              </span>
            </div>

            <button className="btn btn-primario login-boton" type="submit" disabled={enviando}>
              {enviando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Registrar mi empresa'}
            </button>

            <div className="login-enlaces">
              <Link to="/login">Ya tengo cuenta, volver al inicio de sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}