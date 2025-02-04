import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiInformationOutline } from "@mdi/js";
import { hashProperty, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@tnesh-stack/elements/dist/elements/display-error.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { appStyles } from "../../../app-styles.js";
import "./happ-summary.js";
import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";

/**
 * @element all-happs
 */
@localized()
@customElement("all-happs")
export class AllHapps extends SignalWatcher(LitElement) {
  /**
   * @internal
   */
  @consume({ context: happsStoreContext, subscribe: true })
  happsStore!: HappsStore;

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) {
      return html` <div class="column center-content" style="gap: 16px;">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px;"
          ></sl-icon
        >
        <span class="placeholder">${msg("No happs found")}</span>
      </div>`;
    }

    return html`
      <div class="column" style="gap: 16px; flex: 1">
        ${hashes.map(hash => html`<happ-summary .happHash=${hash}></happ-summary>`)}
      </div>
    `;
  }

  render() {
    const map = this.happsStore.allHapps.get();

    switch (map.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the happs")}
          .error=${map.error}
        ></display-error>`;
      case "completed":
        return this.renderList(Array.from(map.value.keys()));
    }
  }

  static styles = appStyles;
}
