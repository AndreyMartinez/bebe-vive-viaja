import { useEffect, useState } from 'react';

interface Props {
  /** id del contenedor con scroll horizontal. */
  target: string;
}

/** Flechas para el carrusel de lugares; se deshabilitan en los extremos. */
export default function RailControls({ target }: Props) {
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = document.getElementById(target);
    if (!rail) return;
    const update = () =>
      setEdge({
        start: rail.scrollLeft <= 4,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
      });
    update();
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      rail.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [target]);

  const move = (dir: 1 | -1) => {
    const rail = document.getElementById(target);
    const card = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !card) return;
    rail.scrollBy({ left: dir * (card.offsetWidth + 28), behavior: 'smooth' });
  };

  return (
    <div className="arrows">
      <button type="button" aria-label="Anterior" disabled={edge.start} onClick={() => move(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" aria-label="Siguiente" disabled={edge.end} onClick={() => move(1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
