import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import './ModalConfirmar.css';

/**
 * Modal de confirmacion para acciones destructivas.
 *
 * Props:
 *   abierto: boolean
 *   onCerrar: () => void
 *   onConfirmar: () => void (puede ser async)
 *   titulo: string (ej: "¿Eliminar Terreno 1?")
 *   descripcion: string (ej: "Esta accion no se puede deshacer.")
 *   etiquetaConfirmar: string (default "Eliminar")
 *   etiquetaCancelar: string (default "Cancelar")
 *   tipo: 'peligro' | 'alerta' (default 'peligro') - controla el color del boton confirmar
 *   cargando: boolean - muestra spinner en el boton confirmar
 */
export default function ModalConfirmar({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  etiquetaConfirmar = 'Eliminar',
  etiquetaCancelar = 'Cancelar',
  tipo = 'peligro',
  cargando = false,
}) {
  if (!abierto) return null;

  async function manejarConfirmar() {
    await onConfirmar();
  }

  const claseColor = tipo === 'peligro' ? 'modal-confirmar-peligro' : 'modal-confirmar-alerta';
  const IconoBoton = tipo === 'peligro' ? Trash2 : AlertTriangle;

  return (
    <Modal abierto={abierto} onCerrar={cargando ? () => {} : onCerrar} titulo={titulo}>
      <div className={`modal-confirmar ${claseColor}`}>
        <div className="modal-confirmar-icono">
          <AlertTriangle size={20} strokeWidth={1.8} />
        </div>

        <p className="modal-confirmar-descripcion">{descripcion}</p>

        <div className="modal-confirmar-acciones">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={onCerrar}
            disabled={cargando}
          >
            {etiquetaCancelar}
          </button>
          <button
            type="button"
            className={`btn ${tipo === 'peligro' ? 'btn-peligro' : 'btn-primario'}`}
            onClick={manejarConfirmar}
            disabled={cargando}
          >
            {cargando ? (
              <span className="spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} />
            ) : (
              <>
                <IconoBoton size={13} strokeWidth={2.5} />
                {etiquetaConfirmar}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}