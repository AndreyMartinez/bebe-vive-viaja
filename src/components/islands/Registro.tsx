import { useEffect, useRef, useState } from 'react';
import { enviarRegistro, fetchViaje, mapaEmbed, mapaLink, type RegistroPayload, type ViajePublico } from '../../lib/registro';

interface Props {
  /** URL /exec de la API de Apps Script (`site.registroApi`). */
  api: string;
}

type Carga = 'cargando' | 'sinViaje' | 'listo' | 'error';
type Envio = 'idle' | 'enviando' | 'enviado' | 'error';
type Campo = 'parada' | 'personas' | 'telefono' | 'archivo';

const MAX_BYTES = 10 * 1024 * 1024;
const REDUCIR_DESDE = 2 * 1024 * 1024;

const soloDigitos = (s: string) => s.replace(/\D/g, '');

function aBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Fotos de más de 2 MB se reducen a 2000 px de lado mayor (JPEG 85 %) para que suban rápido desde el celular. */
async function prepararArchivo(file: File): Promise<RegistroPayload['archivo']> {
  if (file.type.startsWith('image/') && file.size > REDUCIR_DESDE) {
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * k);
      canvas.height = Math.round(bmp.height * k);
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
      if (blob) return { nombre: file.name.replace(/\.[^.]+$/, '') + '.jpg', tipo: 'image/jpeg', base64: await aBase64(blob) };
    } catch {
      /* formato que el navegador no decodifica (p. ej. HEIC): se manda el original */
    }
  }
  return { nombre: file.name, tipo: file.type || 'application/octet-stream', base64: await aBase64(file) };
}

const peso = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function Registro({ api }: Props) {
  const [ref, setRef] = useState<string | null>(null);
  const [carga, setCarga] = useState<Carga>('cargando');
  const [viaje, setViaje] = useState<ViajePublico | null>(null);
  const [intento, setIntento] = useState(0);

  const [parada, setParada] = useState<number | null>(null);
  const [personas, setPersonas] = useState<string[]>(['']);
  const [telefono, setTelefono] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  // Los errores se muestran después del primer intento de guardar y se recalculan al corregir cada campo.
  const [intentado, setIntentado] = useState(false);
  const [errServidor, setErrServidor] = useState<Partial<Record<Campo, string>>>({});

  const [envio, setEnvio] = useState<Envio>('idle');
  const [folio, setFolio] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = new URLSearchParams(location.search).get('viaje')?.trim() ?? '';
    setRef(r);
    if (!r) {
      setCarga('sinViaje');
      return;
    }
    let vivo = true;
    setCarga('cargando');
    fetchViaje(api, r)
      .then((v) => {
        if (!vivo) return;
        setViaje(v);
        setCarga(v ? 'listo' : 'sinViaje');
      })
      .catch(() => vivo && setCarga('error'));
    return () => {
      vivo = false;
    };
  }, [api, intento]);

  // El nombre del viaje también va en la portada (fuera de la isla).
  useEffect(() => {
    if (!viaje) return;
    document.querySelectorAll<HTMLElement>('[data-viaje-nombre]').forEach((el) => {
      el.textContent = viaje.nombre;
      el.hidden = false;
    });
    document.title = `Bienvenida · ${viaje.nombre}`;
  }, [viaje]);

  useEffect(() => {
    if (envio === 'enviado') top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [envio]);

  if (carga === 'cargando' || ref === null) {
    return (
      <div className="reg-aviso" aria-live="polite">
        <p>Cargando tu viaje…</p>
      </div>
    );
  }
  if (carga === 'error') {
    return (
      <div className="reg-aviso" role="alert">
        <h2>No pudimos cargar tu viaje</h2>
        <p>Revisa tu conexión e inténtalo de nuevo. Mientras, abajo están las políticas de cancelación.</p>
        <button type="button" className="btn solid" onClick={() => setIntento((n) => n + 1)}>
          Reintentar
        </button>
      </div>
    );
  }
  if (carga === 'sinViaje' || !viaje) {
    return (
      <div className="reg-aviso">
        <h2>Esta liga no corresponde a un viaje</h2>
        <p>Pide tu liga personalizada a quien te vendió tu lugar para registrar tu punto de abordaje y tu comprobante.</p>
      </div>
    );
  }
  if (viaje.estado === 'cerrado') {
    return (
      <div className="reg-aviso dark">
        <span className="label">Registro cerrado</span>
        <p>Este viaje ya no recibe registros. Si ya pagaste y no te registraste, escríbenos por WhatsApp.</p>
      </div>
    );
  }

  const sel = parada === null ? null : viaje.paradas[parada];
  const sinParadas = viaje.paradas.length === 0;
  const enviando = envio === 'enviando';
  const nombresValidos = personas.map((p) => p.trim()).filter(Boolean);

  if (envio === 'enviado' && sel) {
    return (
      <div className="reg-ok" ref={top}>
        <section className="reg-ok-card">
          <span className="reg-ok-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <h2 className="brush">¡Listo!</h2>
          <p>Recibimos tu registro y tu comprobante. Te avisaremos por WhatsApp cuando validemos el pago.</p>
          <span className="label">Tu folio</span>
          <span className="reg-folio">{folio}</span>
        </section>
        <dl className="reg-resumen">
          <div>
            <dt className="label">Te recogemos en</dt>
            <dd>
              <b>{sel.nombre}</b>
              <span>{sel.direccion}</span>
              <a href={mapaLink(sel)} target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
            </dd>
          </div>
          <div>
            <dt className="label">Viajan · {nombresValidos.length} {nombresValidos.length === 1 ? 'persona' : 'personas'}</dt>
            <dd>
              {nombresValidos.map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </dd>
          </div>
          <div className="row">
            <dt className="label">Comprobante</dt>
            <dd>
              <span className="reg-pendiente">En revisión</span>
            </dd>
          </div>
        </dl>
        <p className="reg-nota">Toma captura de esta pantalla. Si necesitas cambiar algo, escríbenos por WhatsApp con tu folio.</p>
      </div>
    );
  }

  const validar = () => {
    const e: Partial<Record<Campo, string>> = {};
    if (parada === null) e.parada = 'Elige dónde te recogemos.';
    if (personas.some((p) => !p.trim())) e.personas = 'Escribe el nombre completo de cada persona o quita los campos vacíos.';
    if (soloDigitos(telefono).length !== 10) e.telefono = 'Escribe los 10 dígitos de tu celular.';
    if (!archivo) e.archivo = 'Sube tu comprobante de pago.';
    else if (!(archivo.type.startsWith('image/') || archivo.type === 'application/pdf')) e.archivo = 'El comprobante debe ser una foto o un PDF.';
    else if (archivo.size > MAX_BYTES) e.archivo = 'El archivo pesa más de 10 MB. Manda una captura de pantalla.';
    return e;
  };
  const errores = intentado ? { ...errServidor, ...validar() } : errServidor;

  const guardar = async (ev: { preventDefault: () => void }) => {
    ev.preventDefault();
    if (enviando) return;
    const e = validar();
    setIntentado(true);
    setErrServidor({});
    const primero = (['parada', 'personas', 'telefono', 'archivo'] as Campo[]).find((c) => e[c]);
    if (primero) {
      document.getElementById(`reg-${primero}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setEnvio('enviando');
    setErrorEnvio('');
    try {
      const res = await enviarRegistro(api, {
        ref: viaje.ref,
        parada: parada!,
        personas: personas.map((p) => p.trim()),
        telefono: soloDigitos(telefono),
        archivo: await prepararArchivo(archivo!),
        sitio: '',
      });
      if (res.ok) {
        setFolio(res.folio);
        setEnvio('enviado');
        return;
      }
      setErrorEnvio(
        res.error === 'viaje_cerrado'
          ? 'El registro de este viaje se cerró. Escríbenos por WhatsApp.'
          : res.error === 'archivo_grande'
            ? 'El comprobante pesa demasiado. Manda una captura de pantalla.'
            : 'Revisa tus datos e inténtalo de nuevo.',
      );
      if (res.campo) setErrServidor({ [res.campo as Campo]: 'Revisa este dato.' });
    } catch {
      setErrorEnvio('Revisa tu conexión. Tus datos y tu comprobante siguen aquí.');
    }
    setEnvio('error');
  };

  const setPersona = (i: number, v: string) => setPersonas((ps) => ps.map((p, k) => (k === i ? v : p)));

  return (
    <form className="reg" onSubmit={guardar} noValidate>
      <div className="reg-pasos">
        <section className="reg-paso" id="reg-parada">
          <h2>
            <span className="n">01</span>¿Dónde te recogemos?
          </h2>
          {sinParadas ? (
            <p className="reg-vacio">Pronto publicaremos los puntos de abordaje. Vuelve a abrir esta liga en unos días.</p>
          ) : (
            <fieldset aria-describedby={errores.parada ? 'err-parada' : undefined}>
              <legend className="sr-only">Punto de abordaje</legend>
              {viaje.paradas.map((p, i) => (
                <label key={i} className={`reg-parada${parada === i ? ' on' : ''}`}>
                  <input type="radio" name="parada" checked={parada === i} onChange={() => setParada(i)} />
                  <span>
                    <b>{p.nombre}</b>
                    <small>{p.direccion}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {errores.parada && <p className="reg-err" id="err-parada">{errores.parada}</p>}
          {sel && (
            <div className="reg-mapa reg-mapa-movil">
              <iframe title={`Mapa: ${sel.nombre}`} src={mapaEmbed(sel)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <a href={mapaLink(sel)} target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
            </div>
          )}
        </section>

        <section className="reg-paso" id="reg-personas">
          <h2>
            <span className="n">02</span>¿Quiénes viajan?
          </h2>
          <p className="reg-ayuda">Nombre completo de cada persona de tu apartado. El apartado es por persona.</p>
          <div className="reg-personas">
            {personas.map((p, i) => (
              <div key={i} className="reg-campo">
                <label htmlFor={`persona-${i}`} className="label">
                  Persona {i + 1}
                </label>
                <div className="reg-fila">
                  <input
                    id={`persona-${i}`}
                    type="text"
                    autoComplete={i === 0 ? 'name' : 'off'}
                    placeholder="Nombre y apellidos"
                    value={p}
                    onChange={(e) => setPersona(i, e.target.value)}
                    aria-invalid={!!errores.personas && !p.trim()}
                  />
                  {personas.length > 1 && (
                    <button type="button" className="reg-quitar" aria-label={`Quitar persona ${i + 1}`} onClick={() => setPersonas((ps) => ps.filter((_, k) => k !== i))}>
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errores.personas && <p className="reg-err">{errores.personas}</p>}
          <button type="button" className="reg-agregar" onClick={() => setPersonas((ps) => [...ps, ''])}>
            + Agregar persona
          </button>
          <div className="reg-campo reg-tel" id="reg-telefono">
            <label htmlFor="telefono" className="label">
              WhatsApp de contacto
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="55 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              aria-invalid={!!errores.telefono}
              aria-describedby="tel-ayuda"
            />
            {errores.telefono ? (
              <p className="reg-err" id="tel-ayuda">{errores.telefono}</p>
            ) : (
              <small id="tel-ayuda">10 dígitos. Por aquí te mandamos la hora de salida.</small>
            )}
          </div>
        </section>

        <section className="reg-paso" id="reg-archivo">
          <h2>
            <span className="n">03</span>Comprobante de pago
          </h2>
          <input
            ref={fileInput}
            id="comprobante"
            className="sr-only"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          {archivo ? (
            <div className="reg-archivo">
              <span className="reg-archivo-ok" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span className="reg-archivo-txt">
                <b>{archivo.name}</b>
                <small>{peso(archivo.size)} · listo para enviar</small>
              </span>
              <button type="button" onClick={() => fileInput.current?.click()}>
                Cambiar
              </button>
            </div>
          ) : (
            <label htmlFor="comprobante" className="reg-subir">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              <b>Subir foto o PDF</b>
              <small>Captura de la transferencia o foto del ticket · máx. 10 MB</small>
            </label>
          )}
          {errores.archivo && <p className="reg-err">{errores.archivo}</p>}
        </section>
      </div>

      <aside className="reg-lado">
        {sel && (
          <div className="reg-mapa reg-mapa-escritorio">
            <iframe title={`Mapa: ${sel.nombre}`} src={mapaEmbed(sel)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
        <section className="reg-total">
          <span className="label">Tu registro</span>
          <div className="reg-total-parada">
            <small>Te recogemos en</small>
            {sel ? (
              <>
                <b>{sel.nombre}</b>
                <small>{sel.direccion}</small>
                <a href={mapaLink(sel)} target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
              </>
            ) : (
              <b className="falta">Elige una parada</b>
            )}
          </div>
          <div className="reg-total-row">
            <span>Personas</span>
            <b>{personas.length}</b>
          </div>
          <div className="reg-total-row">
            <span>Comprobante</span>
            <b>{archivo ? 'Listo' : 'Falta'}</b>
          </div>
          {envio === 'error' && (
            <div className="reg-fallo" role="alert">
              <b>No pudimos guardar tu registro</b>
              <span>{errorEnvio}</span>
            </div>
          )}
          <button type="submit" className="btn solid reg-guardar" disabled={enviando || sinParadas} aria-busy={enviando}>
            {enviando ? 'Guardando…' : envio === 'error' ? 'Reintentar' : 'Guardar mi lugar'}
          </button>
          <small className="reg-acepta">Al guardar aceptas las políticas de cancelación de abajo.</small>
        </section>
      </aside>
    </form>
  );
}
