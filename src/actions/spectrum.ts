import {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { openDashboard } from "../rig";
import { spectrumImage, subscribeSpectrum, unsubscribeSpectrum, type Spectrum } from "../spectrum";

/**
 * Audio spectrum — bars for the bands, and the whole key tinted by the level, so the volume
 * is readable from the corner of the eye while the bars carry the detail.
 *
 * Reads `/api/audio/spectrum` on the rig dashboard. That endpoint starts capturing on the
 * first request and stops on its own once nobody asks, so pulling the key off the deck
 * releases the audio device — nothing here has to remember to shut anything down.
 *
 * Press it to open the dashboard.
 */
@action({ UUID: "com.beennnn.rig.spectrum" })
export class SpectrumAction extends SingletonAction {
	private visible = new Map<string, WillAppearEvent["action"]>();
	private readonly listener = (s: Spectrum | null) => this.render(s);

	override onWillAppear(ev: WillAppearEvent): void {
		this.visible.set(ev.action.id, ev.action);
		subscribeSpectrum(this.listener);
	}
	override onWillDisappear(ev: WillDisappearEvent): void {
		this.visible.delete(ev.action.id);
		if (this.visible.size === 0) unsubscribeSpectrum(this.listener);
	}
	override onKeyDown(_ev: KeyDownEvent): void {
		openDashboard();
	}

	private render(s: Spectrum | null): void {
		const img = spectrumImage(s);
		for (const a of this.visible.values()) void a.setImage(img);
	}
}
