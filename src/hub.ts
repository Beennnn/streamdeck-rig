// One shared poll loop for the whole plugin: fetch /api/state every 2 s and push it to every
// visible action. The timer only runs while at least one key is on the deck.
import { fetchState, type RigState } from "./rig";

type Listener = (state: RigState | null) => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let last: RigState | null = null;

async function tick(): Promise<void> {
	last = await fetchState();
	for (const l of listeners) l(last);
}

export function subscribe(l: Listener): void {
	listeners.add(l);
	if (last) l(last);
	if (!timer) {
		timer = setInterval(tick, 2000);
		void tick();
	}
}

export function unsubscribe(l: Listener): void {
	listeners.delete(l);
	if (listeners.size === 0 && timer) {
		clearInterval(timer);
		timer = null;
	}
}

/** Force an immediate refresh (e.g. right after applying a fix). */
export function refreshSoon(): void {
	setTimeout(() => void tick(), 600);
}
