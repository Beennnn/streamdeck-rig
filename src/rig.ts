// Tiny client for the readyset dashboard API (http://127.0.0.1:8765), plus a key-image
// helper. The plugin only ever talks to localhost — the rig runs on the same Mac.
import { exec } from "node:child_process";

const BASE = process.env.RIG_URL || "http://127.0.0.1:8765";

export type Problem = {
	key: string;
	label: string;
	status: "fail" | "warn";
	detail: string;
	remedy: string | null;
};
export type RigState = { status: string; fails: number; warns: number; problems: Problem[] };

/** Fetch the current state; null on any error (rig off / unreachable). */
export async function fetchState(): Promise<RigState | null> {
	try {
		const r = await fetch(`${BASE}/api/state`, { signal: AbortSignal.timeout(3000) });
		const d: any = await r.json();
		const problems: Problem[] = (d.items ?? [])
			.filter((it: any) => it.status === "fail" || it.status === "warn")
			.map((it: any) => ({ key: it.key, label: it.label, status: it.status, detail: it.detail, remedy: it.remedy ?? null }))
			.sort((a: Problem, b: Problem) =>
				(a.status === "fail" ? 0 : 1) - (b.status === "fail" ? 0 : 1) || a.label.localeCompare(b.label));
		return { status: d.status, fails: d.fails ?? 0, warns: d.warns ?? 0, problems };
	} catch {
		return null;
	}
}

/** Apply one check's fix (POST /api/fix). Silent on error. */
export async function applyFix(key: string): Promise<void> {
	try {
		await fetch(`${BASE}/api/fix`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ key }),
			signal: AbortSignal.timeout(8000),
		});
	} catch {
		/* ignore */
	}
}

/** Open the web dashboard in the default browser. */
export function openDashboard(): void {
	exec(`open ${BASE}`);
}

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Build a 144×144 SVG key image (coloured background + up to 3 text lines) as a data URI. */
export function keyImage(bg: string, top: string, mid: string, bottom: string): string {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">` +
		`<rect width="144" height="144" rx="20" fill="${bg}"/>` +
		(top ? `<text x="72" y="46" font-family="-apple-system,Helvetica,Arial" font-size="30" fill="#fff" text-anchor="middle">${esc(top)}</text>` : "") +
		(mid ? `<text x="72" y="${top ? 86 : 74}" font-family="-apple-system,Helvetica,Arial" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">${esc(mid)}</text>` : "") +
		(bottom ? `<text x="72" y="${top ? 114 : 104}" font-family="-apple-system,Helvetica,Arial" font-size="13" fill="#e6e6e6" text-anchor="middle">${esc(bottom)}</text>` : "") +
		`</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Palette shared with the menubar app.
export const COLORS = { fail: "#c0392b", warn: "#d9821e", ok: "#2e7d32", idle: "#3a3a3a" };

/** Shorten a check label for a key (strip parentheticals/quotes, cap length). */
export function shortLabel(label: string): string {
	let s = label;
	for (const sep of [" (", " «", " —", " :"]) {
		const i = s.indexOf(sep);
		if (i > 0) s = s.slice(0, i);
	}
	return s.length <= 14 ? s : s.slice(0, 13) + "…";
}
