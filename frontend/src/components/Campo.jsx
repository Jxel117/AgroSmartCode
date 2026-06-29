import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import './Campo.css';

/**
 * Campo de formulario con validacion inline elegante.
 * Reemplaza la cajita naranja del navegador con un mensaje rojo discreto.
 *
 * Props:
 *   - label: texto del label
 *   - id: id del input
 *   - error: mensaje de error (string o null)
 *   - ayuda: texto de ayuda opcional debajo del campo
 *   - children: el input/select/textarea
 *   - obligatorio: si true, muestra * rojo en el label
 */
const Campo = forwardRef(({ label, id, error, ayuda, children, obligatorio, className = '' }, ref) => {
  return (
    <div className={`campo-form ${error ? 'campo-form-error' : ''} ${className}`} ref={ref}>
      {label && (
        <label htmlFor={id}>
          {label}
          {obligatorio && <span className="campo-form-obligatorio"> *</span>}
        </label>
      )}
      {children}
      {error && (
        <div className="campo-form-mensaje-error">
          <AlertCircle size={13} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}
      {!error && ayuda && (
        <span className="campo-form-ayuda">{ayuda}</span>
      )}
    </div>
  );
});

Campo.displayName = 'Campo';
export default Campo;