import {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { COLORS, keyImage, openDashboard, type RigState } from "../rig";
import { subscribe, unsubscribe } from "../hub";

/**
 * Rig status — one key showing the overall readiness: green when everything's OK, red when
 * there are blockers (with the count), orange for warnings only, grey when the rig is offline.
 * Press it to open the web dashboard.
 */
@action({ UUID: "com.beennnn.rig.status" })
export class StatusAction extends SingletonAction {
	private visible = new Map<string, WillAppearEvent["action"]>();
	private readonly listener = (s: RigState | null) => this.render(s);

	override onWillAppear(ev: WillAppearEvent): void {
		this.visible.set(ev.action.id, ev.action);
		subscribe(this.listener);
	}
	override onWillDisappear(ev: WillDisappearEvent): void {
		this.visible.delete(ev.action.id);
		if (this.visible.size === 0) unsubscribe(this.listener);
	}
	override onKeyDown(_ev: KeyDownEvent): void {
		openDashboard();
	}

	private render(s: RigState | null): void {
		let img: string;
		if (!s) img = keyImage(COLORS.idle, "", "Rig", "hors ligne");
		else if (s.fails > 0) img = keyImage(COLORS.fail, `${s.fails}✕`, "Rig", s.warns > 0 ? `${s.warns}⚠` : "à vérifier");
		else if (s.warns > 0) img = keyImage(COLORS.warn, `${s.warns}⚠`, "Rig", "à vérifier");
		else img = keyImage(COLORS.ok, "✓", "Rig", "prêt");
		for (const a of this.visible.values()) void a.setImage(img);
	}
}
