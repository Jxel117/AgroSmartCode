/**
 * Envuelve un input con un icono a la izquierda, como elemento del DOM
 * (no como background-image del input). Esto es a proposito: el "hack"
 * que usan los navegadores para pintar el fondo de autocompletado tapa
 * cualquier background-image del input, pero no puede tapar un elemento
 * hermano posicionado encima.
 */
export default function CampoConIcono({ icono: Icono, children }) {
  return (
    <div className="campo-con-icono">
      <Icono className="campo-con-icono-marca" size={16} strokeWidth={2} aria-hidden="true" />
      {children}
    </div>
  );
}
