// Client for the dashboard's audio spectrum (`/api/audio/spectrum`), plus the key drawing.
//
// Its own poll loop, separate from hub.ts: the rig state is worth re-reading every 2 s, a
// spectrum is worth nothing at that rate. The loop only runs while a spectrum key is on the
// deck — and the server side stops capturing by itself once nobody asks, so a key removed
// from the deck releases the audio device without anyone having to say so.
const BASE = process.env.RIG_URL || "http://127.0.0.1:8765";

/** ~8 refreshes per second. Faster looks no better on a 96 px key and just burns image
 *  encoding; slower turns a bar meter into a slideshow. */
const PERIOD_MS = 120;

export type Spectrum = {
	available: boolean;
	rms: number;
	peak: number;
	bands: number[];
	reason?: string;
};

export async function fetchSpectrum(): Promise<Spectrum | null> {
	try {
		const r = await fetch(`${BASE}/api/audio/spectrum`, { signal: AbortSignal.timeout(2000) });
		const d: any = await r.json();
		return {
			available: !!d.available,
			rms: d.rms ?? 0,
			peak: d.peak ?? 0,
			bands: Array.isArray(d.bands) ? d.bands : [],
			reason: d.reason,
		};
	} catch {
		return null;
	}
}

type Listener = (s: Spectrum | null) => void;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;

async function tick(): Promise<void> {
	const s = await fetchSpectrum();
	for (const l of listeners) l(s);
}

export function subscribeSpectrum(l: Listener): void {
	listeners.add(l);
	if (!timer) {
		timer = setInterval(() => void tick(), PERIOD_MS);
		void tick();
	}
}

export function unsubscribeSpectrum(l: Listener): void {
	listeners.delete(l);
	if (listeners.size === 0 && timer) {
		clearInterval(timer);
		timer = null;
	}
}

/**
 * Level → background colour. It is the thing you catch without looking, so it says how loud,
 * and the bars say what.
 *
 * Thresholds on the RAW rms, not on the compressed value used for the bars: they mean
 * something out here. Silence is GREY, never green — a first pass showed a mute rig with a
 * green key, which reads as "all good" when it means "no sound at all", the exact
 * contradiction the rest of this rig is built to avoid. Green is a signal at a normal level,
 * amber is hot, red is a peak against the ceiling — the one that costs you a take.
 */
function volumeColor(rms: number, peak: number): string {
	if (peak >= 0.98) return "#b3291f";              // ça touche le plafond, quoi que dise le rms
	if (rms < 0.002) return "#2b2b2e";               // silence : gris, pas noir — la touche existe
	if (rms < 0.25) return "#1f6d33";
	if (rms < 0.45) return "#b07d18";
	return "#b3291f";
}

/**
 * A 144×144 key: bars for the bands, background for the level.
 *
 * Levels are square-rooted before drawing. A linear scale spends most of its height on the
 * loudest instants and leaves everything else flat against the floor — the ear doesn't work
 * that way, and neither should a meter you glance at while playing.
 */
export function spectrumImage(s: Spectrum | null): string {
	const W = 144, H = 144, PAD = 8;
	if (!s || !s.available) {
		const msg = !s ? "hors ligne" : "démarrage";
		return uri(
			`<rect width="${W}" height="${H}" rx="20" fill="#2b2b2e"/>` +
			`<text x="72" y="70" font-family="-apple-system,Helvetica,Arial" font-size="20" fill="#8a8a8f" text-anchor="middle">spectre</text>` +
			`<text x="72" y="94" font-family="-apple-system,Helvetica,Arial" font-size="15" fill="#6a6a6f" text-anchor="middle">${msg}</text>`);
	}
	const bands = s.bands.length ? s.bands : new Array(16).fill(0);
	const n = bands.length;
	const usable = W - PAD * 2;
	const slot = usable / n;
	const bw = Math.max(3, slot - 2);
	let bars = "";
	for (let i = 0; i < n; i++) {
		const v = Math.min(1, Math.sqrt(Math.max(0, bands[i])) * 1.6);
		const h = Math.max(2, v * (H - PAD * 2));
		const x = PAD + i * slot + (slot - bw) / 2;
		bars += `<rect x="${x.toFixed(1)}" y="${(H - PAD - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="#f2f2f2" fill-opacity="0.92"/>`;
	}
	return uri(`<rect width="${W}" height="${H}" rx="20" fill="${volumeColor(s.rms, s.peak)}"/>${bars}`);
}

function uri(inner: string): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${inner}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
