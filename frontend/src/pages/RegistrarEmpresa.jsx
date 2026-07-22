import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authApi } from '../api/endpoints.js';
import { useValidacionForm } from '../hooks/useValidacionForm.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Campo from '../components/Campo.jsx';
import CampoConIcono from '../components/CampoConIcono.jsx';
import { notif } from '../utils/notif.js';

const reglas = {
  nombre: (v) => !v?.trim() ? 'El nombre es obligatorio' : null,
  apellido: (v) => !v?.trim() ? 'El apellido es obligatorio' : null,
  correoValidacion: (v) => {
    if (!v?.trim()) return 'El correo es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo no válido';
    return null;
  },
  empresaIdentificador: (v) => !v?.trim() ? 'El nombre de la empresa es obligatorio' : null,
};

export default function RegistrarEmpresa() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', correoValidacion: '', empresaIdentificador: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  const { errores, validar, limpiarError } = useValidacionForm();

  function traducirCampo(campo) {
    const traducciones = {
      nombre: 'Nombre',
      apellido: 'Apellido',
      correoValidacion: 'Correo Gmail',
      empresaIdentificador: 'Empresa',
    };
    return traducciones[campo] ?? campo;
  }

  function setField(campo, valor) {
    setForm({ ...form, [campo]: valor });
    if (errores[campo]) limpiarError(campo);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!validar(form, reglas)) return;
    setEnviando(true);
    setError('');
    try {
      const { data } = await authApi.registrarEmpresa(form);
      setExito(data);
      notif.formulario.exito('Empresa registrada correctamente. Revisa tu correo.');
    } catch (err) {
      const detalles = err.response?.data?.details;
      if (Array.isArray(detalles) && detalles.length > 0) {
        setError(detalles.map((d) => `• ${traducirCampo(d.campo)}: ${d.mensaje}`).join('\n'));
      } else {
        const mensaje = err.response?.data?.error ?? 'No se pudo registrar';
        setError(mensaje);
        notif.formulario.error(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Registra tu empresa" subtitulo="Registra tu finca y empieza a regar inteligente">
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
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>¡Activa tu cuenta!</p>
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
        <form onSubmit={enviar} noValidate>
          {error && <div className="login-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

          <Campo label="Nombre" id="nombre" error={errores.nombre}>
            <input id="nombre" value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)} />
          </Campo>

          <Campo label="Apellido" id="apellido" error={errores.apellido}>
            <input id="apellido" value={form.apellido}
              onChange={(e) => setField('apellido', e.target.value)} />
          </Campo>

          <Campo label="Correo Gmail de validación" id="correoVal" error={errores.correoValidacion}
            ayuda="Aquí enviaremos el enlace para activar tu cuenta. Solo @gmail.com.">
            <CampoConIcono icono={Mail}>
              <input id="correoVal" type="email" value={form.correoValidacion}
                onChange={(e) => setField('correoValidacion', e.target.value)}
                placeholder="tucorreo@gmail.com" />
            </CampoConIcono>
          </Campo>

          <Campo label="Nombre de tu empresa o finca" id="empresa" error={errores.empresaIdentificador}
            ayuda="Identifica tu empresa. Tus agricultores estarán asociados a este nombre.">
            <input id="empresa" value={form.empresaIdentificador}
              onChange={(e) => setField('empresaIdentificador', e.target.value)}
              placeholder="Nombre de tu empresa o finca" />
          </Campo>

          <button className="btn btn-primario login-boton" type="submit" disabled={enviando}>
            {enviando ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Registrar mi empresa'}
          </button>

          <div className="login-enlaces">
            <Link to="/login">Ya tengo cuenta, volver al inicio de sesión</Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}