// Entry point for the Rig plugin (com.beennnn.rig): show readyset readiness on the deck and
// one-tap the fixes. Talks only to the local dashboard at 127.0.0.1:8765.
import streamDeck from "@elgato/streamdeck";

import { StatusAction } from "./actions/status";
import { SlotAction } from "./actions/slot";
import { FixAllAction } from "./actions/fixall";

streamDeck.actions.registerAction(new StatusAction());
streamDeck.actions.registerAction(new SlotAction());
streamDeck.actions.registerAction(new FixAllAction());

streamDeck.connect();
