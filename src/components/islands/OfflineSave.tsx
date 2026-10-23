import { useEffect, useRef, useState } from 'react';
import { findSaved, loadBundle, offlineSupported, OfflineError, removeTrip, requestPersist, saveTrip, type OfflineBundle, type SavedMeta } from '../../lib/offline';

interface Props {
  slug: string;
  /** `offline/<slug>.json`, generado en el build por `src/integrations/offline.ts`. */
  jsonUrl: string;
}

type Status =
  | { kind: 'cargando' }
  | { kind: 'listo' }
  | { kind: 'descargando'; done: number; total: number }
  | { kind: 'guardado' }
  | { kind: 'error'; reason: 'red' | 'espacio' };

/** Lo que dispara Chrome en Android cuando el sitio se puede instalar (lo captura `Base.astro`). */
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}
declare global {
  interface Window {
    bvvInstall?: InstallPrompt | null;
  }
}

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

/**
 * "Descargar para usar sin señal": guarda la página del viaje en el teléfono (Cache API) y
 * `public/sw.js` la sirve sin red. Si ya estaba guardada y hay una versión nueva publicada,
 * se actualiza sola en segundo plano. Ver `specs/offline-viajes/`.
 */
export default function OfflineSave({ slug, jsonUrl }: Props) {
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: 'cargando' });
  const [bundle, setBundle] = useState<OfflineBundle | null>(null);
  const [saved, setSaved] = useState<SavedMeta | null>(null);
  const [online, setOnline] = useState(true);
  const [device, setDevice] = useState<{ ios: boolean; mobile: boolean; standalone: boolean }>({ ios: false, mobile: false, standalone: false });
  const [canInstall, setCanInstall] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV || !offlineSupported()) {
      setSupported(false);
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setDevice({
      ios,
      mobile: ios || /Android/.test(ua),
      standalone: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    });
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const install = () => setCanInstall(!!window.bvvInstall);
    addEventListener('online', on);
    addEventListener('offline', off);
    addEventListener('bvv-install', install);
    install();

    (async () => {
      const meta = await findSaved(slug).catch(() => null);
      setSaved(meta);
      let b: OfflineBundle | null = null;
      try {
        b = await loadBundle(jsonUrl);
        setBundle(b);
      } catch {
        /* sin red o sin JSON: si hay copia, se muestra como guardada */
      }
      if (!meta) {
        if (!b && navigator.onLine) setSupported(false); // build sin offline/<slug>.json
        else setStatus({ kind: 'listo' });
        return;
      }
      setStatus({ kind: 'guardado' });
      // Versión publicada distinta: se actualiza en segundo plano sin tocar el botón (req. 4.2).
      if (b && b.version !== meta.version && !busy.current) {
        busy.current = true;
        try {
          setSaved(await saveTrip(b));
        } catch {
          /* se queda la copia anterior; se reintenta la próxima vez */
        } finally {
          busy.current = false;
        }
      }
    })();

    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', off);
      removeEventListener('bvv-install', install);
    };
  }, [slug, jsonUrl]);

  // Abrió sin señal y sin copia: al volver la red se carga la lista para poder descargar.
  useEffect(() => {
    if (online && !bundle && status.kind === 'listo') loadBundle(jsonUrl).then(setBundle, () => {});
  }, [online, bundle, status.kind, jsonUrl]);

  async function download() {
    if (!bundle || busy.current) return;
    busy.current = true;
    requestPersist();
    try {
      const meta = await saveTrip(bundle, (done, total) => setStatus({ kind: 'descargando', done, total }));
      setSaved(meta);
      setStatus({ kind: 'guardado' });
    } catch (e) {
      setStatus({ kind: 'error', reason: e instanceof OfflineError ? e.kind : 'red' });
    } finally {
      busy.current = false;
    }
  }

  async function remove() {
    await removeTrip(slug);
    setSaved(null);
    setStatus({ kind: 'listo' });
  }

  async function installApp() {
    const p = window.bvvInstall;
    if (!p) return;
    await p.prompt();
    window.bvvInstall = null;
    setCanInstall(false);
  }

  if (!supported) return null;

  const size = bundle ? `≈ ${mb(bundle.bytes)}` : '';
  const iosOutside = device.ios && !device.standalone;

  return (
    <div className="off-save">
      <div className="off-text">
        <span className="label">Sin señal en el camino</span>
        <p>
          Descarga esta guía antes de salir y el itinerario, las fotos, el checklist y las audioguías funcionan sin internet.{' '}
          <span className="off-note">Mapas, WhatsApp y registro sí necesitan señal.</span>
        </p>
      </div>

      <div className="off-ctrl">
        <div aria-live="polite">
          {status.kind === 'cargando' && <span className="label off-muted">Revisando…</span>}

          {status.kind === 'listo' &&
            (bundle ? (
              <button type="button" className="btn solid" onClick={download}>
                Descargar para usar sin señal <span className="off-size">{size}</span>
              </button>
            ) : (
              <span className="label off-muted">Conéctate para descargar esta guía</span>
            ))}

          {status.kind === 'descargando' && (
            <div className="off-prog">
              <div className="off-bar" role="progressbar" aria-label="Descargando la guía" aria-valuemin={0} aria-valuemax={status.total} aria-valuenow={status.done}>
                <i style={{ width: `${(status.done / Math.max(1, status.total)) * 100}%` }} />
              </div>
              <span className="label">
                Descargando {status.done} / {status.total}
              </span>
            </div>
          )}

          {status.kind === 'guardado' && saved && (
            <div className="off-done">
              <span className="off-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                Disponible sin conexión
              </span>
              <span className="label off-muted">Descargada el {fecha(saved.savedAt)}</span>
              <button type="button" className="off-link" onClick={remove}>
                Quitar del teléfono
              </button>
            </div>
          )}

          {status.kind === 'error' && (
            <div className="off-err">
              <p role="alert">
                {status.reason === 'espacio'
                  ? `Tu teléfono no tiene espacio para guardar este viaje (${size}).`
                  : 'No se pudo descargar todo. Intenta con wifi.'}
              </p>
              <button type="button" className="btn" onClick={download}>
                Reintentar
              </button>
            </div>
          )}
        </div>

        {device.mobile && !device.standalone && (status.kind === 'guardado' || iosOutside) && (
          <div className="off-home">
            {device.ios ? (
              <p>
                <b>Tip para iPhone:</b> toca Compartir → <i>Agregar a inicio</i>. El ícono guarda sus datos aparte de Safari: ábrelo con señal y
                toca <i>Descargar</i> ahí también.
              </p>
            ) : canInstall ? (
              <button type="button" className="off-link" onClick={installApp}>
                Agregar a la pantalla de inicio
              </button>
            ) : (
              <p>
                <b>Tip:</b> en el menú ⋮ toca <i>Agregar a la pantalla principal</i> para abrir la guía desde un ícono.
              </p>
            )}
          </div>
        )}
      </div>

      {!online && (
        <div className="off-pill label" role="status">
          {saved ? 'Sin conexión · usando la copia guardada' : 'Sin conexión'}
        </div>
      )}
    </div>
  );
}
