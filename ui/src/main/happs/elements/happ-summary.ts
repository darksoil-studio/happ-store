import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { hashProperty } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { localized, msg } from "@lit/localize";

import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";

import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@tnesh-stack/elements/dist/elements/display-error.js";
import { appStyles } from "../../../app-styles.js";
import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { Happ } from "../types.js";

/**
 * @element happ-summary
 * @fires happ-selected: detail will contain { happHash }
 */
@localized()
@customElement("happ-summary")
export class HappSummary extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the Happ to show
   */
  @property(hashProperty("happ-hash"))
  happHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: happsStoreContext, subscribe: true })
  happsStore!: HappsStore;

  renderSummary(entryRecord: EntryRecord<Happ>) {
    return html`
      <div class="column" style="gap: 16px;">

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Name")}</strong></span>
          <span style="white-space: pre-line">${entryRecord.entry.name}</span>
        </div>

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Description")}</strong></span>
          <span style="white-space: pre-line">${entryRecord.entry.description}</span>
        </div>

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Icon")}</strong></span>
          <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.icon} style="width: 300px; height: 200px"></show-image></span>
        </div>

      </div>
    `;
  }

  renderHapp() {
    const happ = this.happsStore.happs.get(this.happHash).latestVersion.get();

    switch (happ.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the happ")}
          .error=${happ.error}
        ></display-error>`;
      case "completed":
        return this.renderSummary(happ.value);
    }
  }

  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() =>
      this.dispatchEvent(
        new CustomEvent("happ-selected", {
          composed: true,
          bubbles: true,
          detail: {
            happHash: this.happHash,
          },
        }),
      )}>
      ${this.renderHapp()}
    </sl-card>`;
  }

  static styles = appStyles;
}
