import { useState } from 'react';
import { perfilesApi } from '../api/endpoints.js';
import { useFetch } from '../hooks/useFetch.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import Modal from '../components/Modal.jsx';
import { claseBadgeEstado } from '../utils/formato.js';

const SUELOS = ['HUMIFERO', 'ARENOSO', 'ARCILLOSO'];
const CULTIVOS = ['HORTALIZAS', 'FRUTOS_ROJOS'];
const VACIO = {
  tipoSuelo: 'HUMIFERO', tipoCultivo: 'HORTALIZAS',
  uminRecomendado: 45, umaxRecomendado: 70, uminCriticoRecomendado: 25,
  tMaximoRecomendado: 35, tminRecomendado: 12,
  descripcionAgronomica: '', fuenteReferencia: '',
};

export default function Perfiles() {
  const { datos, cargando, recargar } = useFetch(() => perfilesApi.listar().then((r) => r.data.perfiles));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  function num(campo, e) { setForm({ ...form, [campo]: Number(e.target.value) }); }

  async function crear(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await perfilesApi.crear(form);
      setModal(false);
      setForm(VACIO);
      recargar();
    } catch (err) {
      alert(err.response?.data?.error ?? err.response?.data?.details?.[0]?.mensaje ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este perfil?')) return;
    await perfilesApi.eliminar(id);
    recargar();
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Perfiles agronomicos"
        descripcion="Umbrales recomendados por suelo y cultivo"
        accion={<button className="btn btn-primario" onClick={() => setModal(true)}>+ Nuevo perfil</button>}
      />

      {cargando ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {datos?.map((p) => (
            <div key={p.id_perfil} className="tarjeta" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{p.tipo_cultivo}</h3>
                  <span style={{ fontSize: '0.84rem', color: 'var(--gris-500)' }}>Suelo {p.tipo_suelo}</span>
                </div>
                <span className={`badge ${claseBadgeEstado(p.estado)}`}>{p.estado}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', margin: '1rem 0' }}>
                <Dato etiqueta="Humedad min" valor={`${p.umin_recomendado}%`} />
                <Dato etiqueta="Humedad max" valor={`${p.umax_recomendado}%`} />
                <Dato etiqueta="Critico" valor={`${p.umin_critico_recomendado}%`} />
                <Dato etiqueta="Temp max" valor={`${p.t_maximo_recomendado}°C`} />
              </div>
              {p.descripcion_agronomica && <p style={{ fontSize: '0.84rem', color: 'var(--gris-700)' }}>{p.descripcion_agronomica}</p>}
              <button className="btn btn-peligro" style={{ padding: '0.4rem 0.7rem', marginTop: '1rem' }} onClick={() => eliminar(p.id_perfil)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo="Nuevo perfil agronomico">
        <form onSubmit={crear}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Tipo de suelo</label>
              <select value={form.tipoSuelo} onChange={(e) => setForm({ ...form, tipoSuelo: e.target.value })}>
                {SUELOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Tipo de cultivo</label>
              <select value={form.tipoCultivo} onChange={(e) => setForm({ ...form, tipoCultivo: e.target.value })}>
                {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="campo"><label>Humedad min %</label><input type="number" step="0.1" value={form.uminRecomendado} onChange={(e) => num('uminRecomendado', e)} /></div>
            <div className="campo"><label>Humedad max %</label><input type="number" step="0.1" value={form.umaxRecomendado} onChange={(e) => num('umaxRecomendado', e)} /></div>
            <div className="campo"><label>Humedad critica %</label><input type="number" step="0.1" value={form.uminCriticoRecomendado} onChange={(e) => num('uminCriticoRecomendado', e)} /></div>
            <div className="campo"><label>Temp maxima °C</label><input type="number" step="0.1" value={form.tMaximoRecomendado} onChange={(e) => num('tMaximoRecomendado', e)} /></div>
            <div className="campo"><label>Temp minima °C</label><input type="number" value={form.tminRecomendado} onChange={(e) => num('tminRecomendado', e)} /></div>
          </div>
          <div className="campo"><label>Descripcion</label><input value={form.descripcionAgronomica} onChange={(e) => setForm({ ...form, descripcionAgronomica: e.target.value })} /></div>
          <div className="campo"><label>Fuente de referencia</label><input value={form.fuenteReferencia} onChange={(e) => setForm({ ...form, fuenteReferencia: e.target.value })} /></div>
          <button className="btn btn-primario" type="submit" disabled={guardando} style={{ width: '100%' }}>
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </Modal>
    </>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div style={{ background: 'var(--crema)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radio-sm)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--gris-500)', fontWeight: 600 }}>{etiqueta}</div>
      <div style={{ fontWeight: 600, color: 'var(--verde-700)' }}>{valor}</div>
    </div>
  );
}