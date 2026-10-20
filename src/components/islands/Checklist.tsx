import { useEffect, useState } from 'react';

interface Item {
  text: string;
  hint?: string;
}
interface Props {
  items: Item[];
  /** Clave única por viaje para guardar el progreso en este navegador. */
  storageKey: string;
}

function load(key: string): boolean[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

export default function Checklist({ items, storageKey }: Props) {
  const [done, setDone] = useState<boolean[]>([]);

  useEffect(() => setDone(load(storageKey)), [storageKey]);

  const toggle = (i: number) => {
    const next = items.map((_, k) => (k === i ? !done[k] : !!done[k]));
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* navegador sin almacenamiento: el checklist sigue funcionando en la sesión */
    }
  };

  const count = items.filter((_, i) => done[i]).length;

  return (
    <div>
      <ul className="check">
        {items.map((it, i) => (
          <li key={it.text}>
            <label>
              <input type="checkbox" checked={!!done[i]} onChange={() => toggle(i)} />
              <span>
                {it.text}
                {it.hint && <small>{it.hint}</small>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="prog">
        <div className="bar">
          <i style={{ width: `${(count / items.length) * 100}%` }} />
        </div>
        <span className="label" aria-live="polite">
          {count === items.length ? 'Todo listo' : `${count} / ${items.length}`}
        </span>
      </div>
    </div>
  );
}
