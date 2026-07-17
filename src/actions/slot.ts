import {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DidReceiveSettingsEvent,
} from "@elgato/streamdeck";

import { COLORS, keyImage, shortLabel, applyFix, type Problem, type RigState } from "../rig";
import { subscribe, unsubscribe, refreshSoon } from "../hub";

type SlotSettings = { slot?: number };

/**
 * Problem slot — a key bound to the Nth active problem (slot 1 = most severe). It shows that
 * problem's short name + colour (red blocker / orange warning), and pressing it applies the
 * problem's fix (when the rig offers one). Lay out several of these (slots 1..N) to get a live
 * board: they fill with whatever is currently wrong and empty out as things get fixed.
 */
@action({ UUID: "com.beennnn.rig.slot" })
export class SlotAction extends SingletonAction<SlotSettings> {
	private visible = new Map<string, WillAppearEvent<SlotSettings>["action"]>();
	private last: RigState | null = null;
	private readonly listener = (s: RigState | null) => {
		this.last = s;
		this.render();
	};

	override onWillAppear(ev: WillAppearEvent<SlotSettings>): void {
		this.visible.set(ev.action.id, ev.action);
		subscribe(this.listener);
	}
	override onWillDisappear(ev: WillDisappearEvent<SlotSettings>): void {
		this.visible.delete(ev.action.id);
		if (this.visible.size === 0) unsubscribe(this.listener);
	}
	override onDidReceiveSettings(_ev: DidReceiveSettingsEvent<SlotSettings>): void {
		this.render();
	}

	override async onKeyDown(ev: KeyDownEvent<SlotSettings>): Promise<void> {
		const p = this.problemFor(ev.payload.settings);
		if (p?.remedy) {
			await applyFix(p.key);
			refreshSoon();
		}
	}

	private problemFor(settings: SlotSettings): Problem | undefined {
		const n = Math.max(1, settings.slot ?? 1);
		return this.last?.problems[n - 1];
	}

	private async render(): Promise<void> {
		for (const a of this.visible.values()) {
			const settings = (await a.getSettings()) as SlotSettings;
			const p = this.problemFor(settings);
			if (!p) {
				void a.setImage(keyImage(COLORS.idle, "", "—", ""));
			} else {
				const bg = p.status === "fail" ? COLORS.fail : COLORS.warn;
				const icon = p.status === "fail" ? "✕" : "⚠";
				const bottom = p.remedy ? "▶ corriger" : "";
				void a.setImage(keyImage(bg, icon, shortLabel(p.label), bottom));
			}
		}
	}
}
