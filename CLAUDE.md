# CLAUDE.md — streamdeck-rig

Stream Deck plugin (macOS) that surfaces **readyset** rig readiness and one-taps its fixes.

## Architecture
- `src/rig.ts` — client for `http://127.0.0.1:8765` (`fetchState`, `applyFix`, `openDashboard`)
  + `keyImage()` (SVG data-URI key rendering). Localhost only.
- `src/hub.ts` — ONE poll loop (`/api/state` every 2 s) shared by all keys; timer runs only
  while ≥1 key is on the deck.
- `src/spectrum.ts` — client for `/api/audio/spectrum` + its OWN poll loop (~8 Hz) and the
  bar drawing. Separate from `hub.ts` on purpose: the rig state is worth re-reading every
  2 s, a spectrum is worth nothing at that rate.
- `src/actions/{status,slot,fixall,spectrum}.ts` — SingletonActions. Each keeps its visible keys in a
  `Map<id, action>` (key by `action.id`: WillDisappear gives an `ActionContext`, not a
  `KeyAction`, so you can't key by the object).

## Build
- `@elgato/streamdeck` **2.x** (1.x is not Marketplace-compatible). Rollup → `bin/plugin.js`.
- Manifest `SDKVersion: 3` **requires `Software.MinimumVersion` ≥ 6.6-ish** — with a lower
  value the schema forces `SDKVersion: 2` (that's the "SDKVersion const" validate error). Kept
  at `6.9`.
- `npm run build && npm run validate`. Icons: `npm run icons` (needs `rsvg-convert`).

## Contract with readyset
- `/api/state` → `{status, fails, warns, items:[{key,label,status,detail,remedy}]}`.
- `/api/fix` ← `{key}`. Same remedies as the menubar popup — keep them in sync.
- `/api/audio/spectrum` → `{available, rms, peak, bands[16]}`. The server starts capturing on
  the first request and **stops on its own** once nobody asks — so pulling the key off the
  deck releases the audio device, and nothing here has to remember to shut anything down.

## The spectrum key, and what its colours mean
Bars = bands, background = level. **Silence is GREY, never green** — a first pass showed a
mute rig with a green key, which reads as "all good" when it means "no sound at all". Green
is a signal at a normal level, amber is hot, red is a peak at the ceiling (`peak ≥ 0.98`,
whatever the RMS says). Values are square-rooted before drawing: a linear scale spends its
height on the loudest instants and flattens everything else against the floor.
