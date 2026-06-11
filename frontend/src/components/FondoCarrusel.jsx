import { useEffect, useState } from 'react';

const IMAGENES = [
  '/img/agricultura-1.jpg',
  '/img/agricultura-2.jpg',
  '/img/agricultura-3.jpg',
];

const INTERVALO_MS = 6000; // tiempo entre cambios

export default function FondoCarrusel() {
  const [indiceActivo, setIndiceActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndiceActivo((prev) => (prev + 1) % IMAGENES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {IMAGENES.map((src, idx) => (
        <div
          key={src}
          className="fondo-carrusel-imagen"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(20, 45, 12, 0.25) 0%, rgba(45, 80, 30, 0.15) 50%, rgba(74, 124, 42, 0.25) 100%), url(${src})`,
            opacity: idx === indiceActivo ? 1 : 0,
          }}
        />
      ))}
    </>
  );
}