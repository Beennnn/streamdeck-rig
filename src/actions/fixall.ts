import {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { COLORS, keyImage, applyFix, type RigState } from "../rig";
import { subscribe, unsubscribe, refreshSoon } from "../hub";

/**
 * Fix all — one key that runs every available remedy at once. Shows how many fixable problems
 * there are; green (nothing to do) when the rig is clean.
 */
@action({ UUID: "com.beennnn.rig.fixall" })
export class FixAllAction extends SingletonAction {
	private visible = new Map<string, WillAppearEvent["action"]>();
	private last: RigState | null = null;
	private readonly listener = (s: RigState | null) => {
		this.last = s;
		this.render();
	};

	override onWillAppear(ev: WillAppearEvent): void {
		this.visible.set(ev.action.id, ev.action);
		subscribe(this.listener);
	}
	override onWillDisappear(ev: WillDisappearEvent): void {
		this.visible.delete(ev.action.id);
		if (this.visible.size === 0) unsubscribe(this.listener);
	}
	override async onKeyDown(_ev: KeyDownEvent): Promise<void> {
		for (const p of this.last?.problems ?? []) {
			if (p.remedy) await applyFix(p.key);
		}
		refreshSoon();
	}

	private render(): void {
		const fixable = (this.last?.problems ?? []).filter((p) => p.remedy).length;
		const img = fixable > 0
			? keyImage(COLORS.ok, "⚡", "Tout", `corriger (${fixable})`)
			: keyImage(COLORS.idle, "⚡", "Tout", "corriger");
		for (const a of this.visible.values()) void a.setImage(img);
	}
}
