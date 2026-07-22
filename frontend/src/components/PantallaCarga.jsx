import './PantallaCarga.css';

// Pantalla de carga de marca: se muestra mientras se resuelve la sesion
// (por ejemplo, justo despues del login o al recargar la pagina), en vez
// de dejar la pantalla en blanco.
export default function PantallaCarga({ mensaje = 'Cargando AgroSmart…' }) {
  return (
    <div className="pantalla-carga">
      <div className="pantalla-carga-logo-wrap">
        <span className="pantalla-carga-ping" />
        <img src="/agrosmart.svg" alt="AgroSmart" className="pantalla-carga-logo" />
      </div>
      <p className="pantalla-carga-mensaje">
        <span className="spinner" />
        {mensaje}
      </p>
    </div>
  );
}
