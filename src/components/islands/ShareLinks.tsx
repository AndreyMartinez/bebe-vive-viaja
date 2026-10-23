import { useEffect, useState } from 'react';

interface Props {
  url: string;
  /** Texto que acompaña al enlace al compartir. */
  text: string;
}

/**
 * Botones para compartir un enlace. Instagram y TikTok no tienen liga web para compartir:
 * en el celular se usa el menú nativo ("Compartir", que sí los incluye) y en escritorio se copia el enlace.
 */
export default function ShareLinks({ url, text }: Props) {
  const [native, setNative] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setNative(typeof navigator.share === 'function'), []);

  const share = async () => {
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      /* cancelado por el usuario */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copia el enlace:', url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'X', href: `https://x.com/intent/post?text=${t}&url=${u}` },
  ];

  return (
    <div className="share">
      <span className="label">Compartir</span>
      <div className="share-row">
        {native && (
          <button type="button" className="btn solid" onClick={share}>
            Compartir en Instagram, TikTok…
          </button>
        )}
        {links.map((l) => (
          <a key={l.name} className="btn" href={l.href} target="_blank" rel="noopener">
            {l.name}
          </a>
        ))}
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
      <p className="share-note" aria-live="polite">
        {copied
          ? 'Pégalo en tu historia de Instagram (sticker de enlace) o en tu video de TikTok.'
          : native
            ? 'Desde el celular, "Compartir" abre Instagram, TikTok y tus otras apps.'
            : 'Para Instagram o TikTok, copia el enlace y pégalo en tu historia o video.'}
      </p>
    </div>
  );
}
