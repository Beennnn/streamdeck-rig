// Regenerate the plugin icons (SVG → PNG via rsvg-convert). Run: npm run icons
// The KEY images are placeholders — the plugin overrides them live at runtime (see rig.ts).
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const root = "com.beennnn.rig.sdPlugin/imgs";
const tile = '<rect width="144" height="144" rx="28" fill="#1c1c1e"/>';
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${tile}${inner}</svg>`;

const app = wrap('<circle cx="116" cy="30" r="11" fill="#e0392b"/><text x="72" y="92" font-family="Helvetica" font-weight="700" font-size="52" fill="#fff" text-anchor="middle">Rig</text>');
const status = wrap('<circle cx="72" cy="72" r="42" fill="#2e7d32"/>');
const slot = wrap('<polygon points="72,26 118,112 26,112" fill="#d9821e"/>');
const fixall = wrap('<polygon points="82,22 40,80 68,80 58,122 104,60 74,60" fill="#f0c419"/>');
// Quatre barres de hauteurs différentes : ça se reconnaît à 20 px, ce qu'aucun mot ne fait.
const spectrum = wrap('<rect x="34" y="76" width="14" height="40" rx="3" fill="#4aa3df"/><rect x="56" y="46" width="14" height="70" rx="3" fill="#4aa3df"/><rect x="78" y="62" width="14" height="54" rx="3" fill="#4aa3df"/><rect x="100" y="34" width="14" height="82" rx="3" fill="#4aa3df"/>');
const keyTile = wrap('<text x="72" y="84" font-family="Helvetica" font-weight="700" font-size="30" fill="#fff" text-anchor="middle">Rig</text>');

function png(svg, size, out) {
	execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), "-o", out], { input: svg });
}

for (const dir of ["plugin", "actions/status", "actions/slot", "actions/fixall", "actions/spectrum"]) mkdirSync(`${root}/${dir}`, { recursive: true });

for (const p of ["plugin/icon", "plugin/category"]) { png(app, 28, `${root}/${p}.png`); png(app, 56, `${root}/${p}@2x.png`); }
for (const [name, svg] of [["status", status], ["slot", slot], ["fixall", fixall], ["spectrum", spectrum]]) {
	png(svg, 20, `${root}/actions/${name}/icon.png`);
	png(svg, 40, `${root}/actions/${name}/icon@2x.png`);
	png(keyTile, 72, `${root}/actions/${name}/key.png`);
	png(keyTile, 144, `${root}/actions/${name}/key@2x.png`);
}
console.log("icons regenerated");
