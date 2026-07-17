# Rig — Stream Deck plugin

Show your live-keyboard-rig readiness on a Stream Deck and one-tap the fixes. It's the deck
front-end for [**readyset**](https://github.com/Beennnn/readyset): it reads the local rig
dashboard (`http://127.0.0.1:8765/api/state`) and, on press, runs a fix (`/api/fix`).

> Everything stays local — the plugin only talks to the rig on the same Mac.

## Actions

| Action | What it does |
|---|---|
| **Rig status** | One key showing overall readiness — green (prêt), red with the blocker count, orange for warnings, grey when the rig is offline. Press → opens the web dashboard. |
| **Rig problem** | A key bound to the **Nth active problem** (set the slot in the Property Inspector). Shows its short name + colour (red blocker / orange warning); press to run its fix. Lay out slots 1, 2, 3… for a live board that fills and empties as things break/get fixed. |
| **Rig fix all** | Runs every available fix at once; shows how many are fixable. |

Keys refresh every ~2 s from the rig.

## Build & install (dev)

```bash
npm install
npm run build            # → com.beennnn.rig.sdPlugin/bin/plugin.js
streamdeck link com.beennnn.rig.sdPlugin   # install into Stream Deck
npm run validate
npm run pack             # → dist/com.beennnn.rig.streamDeckPlugin (double-click to install)
```

Requires the readyset dashboard running locally (it is, if the rig menubar/dashboard is up).

## Why a plugin (not just curl buttons)

To *display* the current problems on the keys (names, colours, counts) the plugin has to poll
`/api/state` and update each key's image live — a static button can only fire a fix blind. The
fixes themselves are the rig's own one-click remedies (VPN off, audio → Mac, rejoin stage WiFi,
launch Ableton…), so the deck and the menubar popup drive exactly the same actions.
