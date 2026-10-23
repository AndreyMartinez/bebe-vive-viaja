import { useEffect, useRef, useState } from 'react';

interface Props {
  id: string;
  title: string;
  /** Nombre del viaje, para la pantalla de bloqueo. */
  trip: string;
  script: string[];
  /** MP3 generado con `npm run audioguias`. Sin él se usa la voz del navegador. */
  src?: string;
  /** Segundos (reales o estimados). */
  duration: number;
}

/** Al empezar una guía se avisa a las demás para que se pausen. */
const EVENT = 'bvv-audioguia';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Guion → frases para la voz del navegador, con la pausa que va después de cada una (ms). */
function phrases(script: string[]) {
  const out: { text: string; pause: number }[] = [];
  script.forEach((p, pi) => {
    const parts = p.split('…').map((s) => s.trim()).filter(Boolean);
    parts.forEach((text, i) => out.push({ text, pause: i < parts.length - 1 ? 650 : pi < script.length - 1 ? 1300 : 0 }));
  });
  return out;
}

function spanishVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'es-MX') ?? voices.find((v) => v.lang.startsWith('es'));
}

export default function AudioGuide({ id, title, trip, script, src, duration }: Props) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration);
  const [supported, setSupported] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const speech = useRef({ index: 0, timer: 0, alive: false });
  const list = useRef(phrases(script));

  useEffect(() => {
    if (!src && !('speechSynthesis' in window)) setSupported(false);
    const onOther = (e: Event) => (e as CustomEvent<string>).detail !== id && pause();
    window.addEventListener(EVENT, onOther);
    return () => {
      window.removeEventListener(EVENT, onOther);
      pause();
    };
  }, []);

  function mediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'Bebe, Vive, Viaja · Audioguía', album: trip });
    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => seek((audio.current?.currentTime ?? 0) - 10));
    navigator.mediaSession.setActionHandler('seekforward', () => seek((audio.current?.currentTime ?? 0) + 10));
  }

  function play() {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
    if (src) {
      if (!audio.current) {
        const a = new Audio(src);
        a.preload = 'none';
        a.addEventListener('timeupdate', () => setTime(a.currentTime));
        a.addEventListener('loadedmetadata', () => isFinite(a.duration) && setTotal(a.duration));
        a.addEventListener('play', () => setPlaying(true));
        a.addEventListener('pause', () => setPlaying(false));
        a.addEventListener('ended', () => {
          setPlaying(false);
          setTime(0);
        });
        audio.current = a;
      }
      mediaSession();
      audio.current.play().catch(() => setPlaying(false));
      return;
    }
    // Voz del navegador: frase por frase para poder hacer las pausas del suspenso.
    const s = speech.current;
    if (s.index >= list.current.length) s.index = 0;
    s.alive = true;
    setPlaying(true);
    speakNext();
  }

  function speakNext() {
    const s = speech.current;
    if (!s.alive) return;
    if (s.index >= list.current.length) {
      s.alive = false;
      s.index = 0;
      setPlaying(false);
      setTime(0);
      return;
    }
    const { text, pause } = list.current[s.index];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    const v = spanishVoice();
    if (v) u.voice = v;
    u.rate = 0.92;
    u.pitch = 0.9;
    u.onend = () => {
      s.index++;
      setTime((s.index / list.current.length) * total);
      s.timer = window.setTimeout(speakNext, pause);
    };
    u.onerror = () => {
      s.alive = false;
      setPlaying(false);
    };
    speechSynthesis.speak(u);
  }

  function pause() {
    if (audio.current) audio.current.pause();
    const s = speech.current;
    if (s.alive) {
      s.alive = false;
      clearTimeout(s.timer);
      speechSynthesis.cancel();
    }
    setPlaying(false);
  }

  function seek(to: number) {
    const t = Math.max(0, Math.min(total, to));
    if (src) {
      if (audio.current) audio.current.currentTime = t;
      setTime(t);
      return;
    }
    // Sin MP3 solo se puede saltar entre frases.
    const s = speech.current;
    s.index = Math.floor((t / total) * list.current.length);
    setTime((s.index / list.current.length) * total);
    if (s.alive) {
      clearTimeout(s.timer);
      speechSynthesis.cancel();
      speakNext();
    }
  }

  const pct = total ? Math.min(100, (time / total) * 100) : 0;

  return (
    <div className="ag" data-playing={playing || undefined}>
      {supported && (
        <div className="ag-row">
          <button
            type="button"
            className="ag-btn"
            aria-pressed={playing}
            aria-label={`${playing ? 'Pausar' : 'Escuchar'} audioguía: ${title}`}
            onClick={() => (playing ? pause() : play())}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M8 5l11 7-11 7z" />}
            </svg>
          </button>
          <div className="ag-main">
            <div className="ag-top label">
              <span>{playing ? 'Escuchando' : 'Audioguía'}</span>
              <span>{time > 0 ? `${mmss(time)} / ${mmss(total)}` : mmss(total)}</span>
            </div>
            <div
              className="ag-bar"
              role="slider"
              tabIndex={0}
              aria-label={`Avance de ${title}`}
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(time)}
              aria-valuetext={`${mmss(time)} de ${mmss(total)}`}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * total);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') seek(time + 10);
                if (e.key === 'ArrowLeft') seek(time - 10);
              }}
            >
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}
      <details className="more ag-text">
        <summary>Leer la narración</summary>
        <div className="dm">
          {script.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </details>
    </div>
  );
}
