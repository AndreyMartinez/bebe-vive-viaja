import { useEffect, useState } from 'react';

interface Props {
  /** Instante de salida (ms UTC). */
  departAt: number;
  /** Instante en que el viaje se da por terminado (ms UTC). */
  endAt: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Cuenta regresiva a la salida. En el servidor se renderiza con el tiempo del
 * build y en el navegador se corrige al segundo.
 */
export default function Countdown({ departAt, endAt }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) {
    return <div className="cd" aria-hidden="true" style={{ minHeight: 64 }} />;
  }

  if (now >= endAt) return <p className="cd-msg">Este viaje ya pasó. Gracias por viajar con nosotros.</p>;
  if (now >= departAt) return <p className="cd-msg">El viaje está en curso. Baja para ver qué toca ahora.</p>;

  const s = Math.floor((departAt - now) / 1000);
  const units: [string, string][] = [
    [String(Math.floor(s / 86400)), 'días'],
    [pad(Math.floor((s % 86400) / 3600)), 'hrs'],
    [pad(Math.floor((s % 3600) / 60)), 'min'],
    [pad(s % 60), 'seg'],
  ];

  return (
    <div className="cd" role="timer" aria-label="Tiempo para la salida">
      {units.map(([v, l]) => (
        <div className="u" key={l}>
          <b>{v}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}
