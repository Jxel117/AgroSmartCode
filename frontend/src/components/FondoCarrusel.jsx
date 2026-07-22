import { useEffect, useState } from 'react';

const IMAGENES = [
  '/img/agricultura-1.jpg',
  '/img/agricultura-2.jpg',
  '/img/agricultura-3.jpg',
  '/img/agricultura-4.jpg',
];

const DURACION_MS = 7000;

export default function FondoCarrusel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % IMAGENES.length);
    }, DURACION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fondo-carrusel">
      {IMAGENES.map((src, i) => (
        <div
          key={src}
          className={`fondo-carrusel-imagen${i === indice ? ' fondo-carrusel-imagen--activa' : ''}`}
          style={{ backgroundImage: `url(${src})`, animationDelay: `${i * -9}s` }}
        />
      ))}
    </div>
  );
}
