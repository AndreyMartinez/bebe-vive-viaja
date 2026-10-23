#!/usr/bin/env node
/**
 * Genera las audioguías de todos los viajes: public/audioguias/<viaje>/<id>.mp3
 *
 *   npm run audioguias                 solo las que cambiaron
 *   npm run audioguias -- --force      todas
 *   npm run audioguias -- --muestra pueblo-leyenda --voces Enceladus,Algenib,Charon
 *                                      pruebas de voz en muestras-audioguias/ (no se publican)
 *   npm run audioguias -- --solo los-chinelos   regenera solo esa guía
 *   npm run audioguias -- --elegir pueblo-leyenda --voz Enceladus
 *                                      deja esa muestra como la audioguía publicada
 *
 * Motor de voz (VOZ_MOTOR):
 *   gemini  Gemini TTS. Usa GEMINI_API_KEY de `.env`. Voz y dirección por guía (`guide.voice`, `guide.style`).
 *   macos   `say` con la voz VOZ (Paulina por defecto). Gratis y sin red.
 * Si no se indica, usa gemini cuando hay GEMINI_API_KEY y macos si no.
 *
 * Requiere ffmpeg. Ver specs/audioguias/design.md.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

try {
  process.loadEnvFile('.env');
} catch {
  /* sin .env: se usa el entorno tal cual */
}

const VIAJES = 'src/content/viajes';
const OUT = 'public/audioguias';
const MUESTRAS = 'muestras-audioguias';
const MANIFEST = join(OUT, 'manifest.json');
const KEY = process.env.GEMINI_API_KEY?.trim();
const MOTOR = process.env.VOZ_MOTOR ?? (KEY ? 'gemini' : 'macos');
const MODEL = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.8-flash-tts';
const VOZ_MACOS = process.env.VOZ ?? 'Paulina';
const VOZ_GEMINI = 'Charon';
const RATE = 158; // macOS: palabras por minuto, un poco lento para el suspenso
const ACENTO = 'Narra en español de México, con acento mexicano natural.';
const ESTILO = 'Narrador de audioguía con suspenso: voz cercana, ritmo pausado, tensión que crece antes de cada revelación.';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const force = process.argv.includes('--force');
const muestra = arg('--muestra');
const elegir = arg('--elegir');
const solo = arg('--solo');
const vozElegida = arg('--voz');
const voces = arg('--voces')?.split(',').map((v) => v.trim()).filter(Boolean);

/** Igual que `guideId()` en src/lib/audioguia.ts. */
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function need(cmd, args, hint) {
  try {
    execFileSync(cmd, args, { stdio: 'ignore' });
  } catch {
    console.error(`✗ Falta \`${cmd}\`. ${hint}`);
    process.exit(1);
  }
}
need('ffmpeg', ['-version'], 'Instálalo con: brew install ffmpeg');
if (MOTOR === 'macos') need('say', ['-v', '?'], 'El motor macos solo funciona en macOS. Usa VOZ_MOTOR=gemini.');
if (MOTOR === 'gemini' && !KEY) {
  console.error('✗ Falta GEMINI_API_KEY en .env (ver .env.example).');
  process.exit(1);
}

// ── Voz ──────────────────────────────────────────────────────────────────────

/** macOS: `…` → pausa corta; entre párrafos, pausa larga. */
function sayMacos(g, file) {
  const text = g.script.map((p) => p.replace(/\s*…\s*/g, ' [[slnc 650]] ')).join(' [[slnc 1300]] ');
  execFileSync('say', ['-v', VOZ_MACOS, '-r', String(RATE), '-o', file, text]);
}

/** Gemini: el `…` lo respeta tal cual; entre párrafos, `<long pause>`. La dirección va como `style`. */
async function sayGemini(g, voice, file) {
  const body = {
    model: MODEL,
    input: [
      {
        type: 'user_input',
        content: [
          {
            type: 'text',
            text: g.script.join('\n\n<long pause>\n\n'),
            annotations: [{ type: 'speech_metadata', style: `${g.style ?? ESTILO} ${ACENTO}` }],
          },
        ],
      },
    ],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice }] },
  };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      const audio = (data.steps ?? [])
        .filter((s) => s.type === 'model_output')
        .flatMap((s) => s.content ?? [])
        .filter((c) => c.type === 'audio')
        .at(-1)?.data;
      if (!audio) throw new Error('Gemini respondió sin audio.');
      writeFileSync(file, Buffer.from(audio, 'base64'));
      return;
    }
    const detail = (await res.text()).slice(0, 400);
    // Un límite por día no se arregla esperando segundos: se corta y se avisa.
    if ((res.status === 429 || res.status >= 500) && attempt < 4 && !/per day/i.test(detail)) {
      console.log(`  … Gemini ${res.status}, reintento ${attempt} en ${attempt * 15} s`);
      await new Promise((r) => setTimeout(r, attempt * 15000));
      continue;
    }
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }
}

// ── Mezcla ───────────────────────────────────────────────────────────────────

// Atmósfera: dos graves con trémolo lento + ruido café muy filtrado. Discreta, solo para tensión.
// La voz se normaliza a −18 LUFS para que todas las guías suenen igual de fuerte, venga del motor que venga.
const AMBIENT = [
  '[1:a]volume=0.08,tremolo=f=0.15:d=0.6[s1]',
  '[2:a]volume=0.05,tremolo=f=0.11:d=0.7[s2]',
  '[3:a]lowpass=f=400,volume=0.09[n]',
  '[s1][s2][n]amix=inputs=3:normalize=0,afade=t=in:d=2[amb]',
  '[0:a]aresample=44100,loudnorm=I=-18:TP=-2:LRA=11,aresample=44100,asetpts=N/SR/TB,adelay=2500:all=1,apad=pad_dur=3[v]',
  '[v][amb]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=DUR:d=4,asetpts=N/SR/TB[out]',
].join(';');

function mix(voz, out, meta) {
  const vozDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voz]));
  const total = vozDur + 2.5 + 3;
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-i', voz,
    '-f', 'lavfi', '-i', `sine=f=55:sample_rate=44100:d=${total}`,
    '-f', 'lavfi', '-i', `sine=f=110:sample_rate=44100:d=${total}`,
    '-f', 'lavfi', '-i', `anoisesrc=color=brown:sample_rate=44100:d=${total}`,
    '-filter_complex', AMBIENT.replace('DUR', (total - 4).toFixed(2)),
    '-map', '[out]', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k',
    '-metadata', `title=${meta.title}`, '-metadata', 'artist=Bebe, Vive, Viaja', '-metadata', `album=${meta.album}`,
    out,
  ]);
  return total;
}

/** Firma de lo que produce el audio: si cambia, la guía se regenera. */
function hashOf(g, v) {
  const sig = MOTOR === 'gemini' ? `gemini|${MODEL}|${v}|${g.style ?? ESTILO}` : `macos|${v}|${RATE}`;
  return createHash('sha1').update(`${sig}|${AMBIENT}|${g.script.join('\n')}`).digest('hex').slice(0, 12);
}

const readManifest = () => (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {});
const writeManifest = (m) =>
  writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(m).sort()), null, 2) + '\n');

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// ── Guías ────────────────────────────────────────────────────────────────────

const all = [];
for (const viaje of readdirSync(VIAJES)) {
  const file = join(VIAJES, viaje, 'index.json');
  if (!existsSync(file)) continue;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const album = `${data.title} & ${data.titleAccent}`;
  if (data.guide) all.push({ viaje, album, id: 'tour', title: 'Audioguía del tour', ...data.guide });
  for (const ch of data.chapters ?? []) {
    if (ch.quote?.guide) all.push({ viaje, album, id: `${ch.id}-leyenda`, title: ch.quote.label, ...ch.quote.guide });
    for (const p of ch.places ?? []) if (p.guide) all.push({ viaje, album, id: slug(p.title), title: p.title, ...p.guide });
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'audioguias-'));
async function voice(g, v, file) {
  if (MOTOR === 'gemini') await sayGemini(g, v, file);
  else sayMacos(g, file);
}

try {
  if (elegir) {
    // Una muestra que gustó se queda como definitiva, tal cual (Gemini no repite exactamente la misma lectura).
    const g = all.find((x) => x.id === elegir);
    if (!g) throw new Error(`No hay guía con id "${elegir}". Ids: ${all.map((x) => x.id).join(', ')}`);
    const v = vozElegida ?? g.voice ?? VOZ_GEMINI;
    if (v !== (g.voice ?? VOZ_GEMINI)) throw new Error(`Pon "voice": "${v}" en la guía "${g.title}" del JSON antes de elegir esta muestra.`);
    const src = join(MUESTRAS, `${g.id}-${v}.mp3`);
    if (!existsSync(src)) throw new Error(`No existe ${src}. Genérala con --muestra ${g.id} --voces ${v}`);
    const rel = `audioguias/${g.viaje}/${g.id}.mp3`;
    mkdirSync(join(OUT, g.viaje), { recursive: true });
    copyFileSync(src, join('public', rel));
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]));
    const manifest = readManifest();
    manifest[rel] = { hash: hashOf(g, v), duration: Math.round(duration) };
    writeManifest(manifest);
    console.log(`✓ ${rel} ← ${src}  ${mmss(duration)}`);
  } else if (muestra) {
    // Pruebas de voz: misma guía con varias voces, fuera de public/.
    const g = all.find((x) => x.id === muestra);
    if (!g) throw new Error(`No hay guía con id "${muestra}". Ids: ${all.map((x) => x.id).join(', ')}`);
    mkdirSync(MUESTRAS, { recursive: true });
    for (const v of voces ?? [g.voice ?? VOZ_GEMINI]) {
      const wav = join(tmp, `${v}.${MOTOR === 'gemini' ? 'wav' : 'aiff'}`);
      await voice(g, v, wav);
      const out = join(MUESTRAS, `${g.id}-${MOTOR === 'gemini' ? v : VOZ_MACOS}.mp3`.replace(/[^\w.-]+/g, '_'));
      console.log(`✓ ${out}  ${mmss(mix(wav, out, { title: `${g.title} · ${v}`, album: g.album }))}`);
    }
  } else {
    const manifest = readManifest();
    let made = 0;
    let skipped = 0;
    for (const g of solo ? all.filter((x) => x.id === solo) : all) {
      const v = MOTOR === 'gemini' ? (g.voice ?? VOZ_GEMINI) : VOZ_MACOS;
      const rel = `audioguias/${g.viaje}/${g.id}.mp3`;
      const out = join('public', rel);
      const hash = hashOf(g, v);
      if (!force && !solo && manifest[rel]?.hash === hash && existsSync(out)) {
        skipped++;
        continue;
      }
      mkdirSync(join(OUT, g.viaje), { recursive: true });
      const wav = join(tmp, `${g.id}.${MOTOR === 'gemini' ? 'wav' : 'aiff'}`);
      await voice(g, v, wav);
      const total = mix(wav, out, g);
      manifest[rel] = { hash, duration: Math.round(total) };
      // Se guarda tras cada guía: si algo falla a la mitad, lo hecho no se repite.
      writeManifest(manifest);
      made++;
      console.log(`✓ ${rel}  ${mmss(total)}  (${MOTOR}: ${v})`);
    }
    console.log(`Audioguías: ${made} generadas, ${skipped} sin cambios.`);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
