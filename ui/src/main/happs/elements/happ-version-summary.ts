import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { hashProperty } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { localized, msg } from "@lit/localize";

import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";

import "@tnesh-stack/elements/dist/elements/display-error.js";
import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import { appStyles } from "../../../app-styles.js";
import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { HappVersion } from "../types.js";

/**
 * @element happ-version-summary
 * @fires happ-version-selected: detail will contain { happVersionHash }
 */
@localized()
@customElement("happ-version-summary")
export class HappVersionSummary extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the HappVersion to show
   */
  @property(hashProperty("happ-version-hash"))
  happVersionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: happsStoreContext, subscribe: true })
  happsStore!: HappsStore;

  renderSummary(entryRecord: EntryRecord<HappVersion>) {
    return html`
      <div class="column" style="gap: 16px;">

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Version")}</strong></span>
          <span style="white-space: pre-line">${entryRecord.entry.version}</span>
        </div>

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Changes")}</strong></span>
          <span style="white-space: pre-line">${entryRecord.entry.changes}</span>
        </div>

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Web Happ Bundle Hash")}</strong></span>
          <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.web_happ_bundle_hash} style="width: 300px; height: 200px"></show-image></span>
        </div>

      </div>
    `;
  }

  renderHappVersion() {
    const happVersion = this.happsStore.happVersions.get(this.happVersionHash).latestVersion.get();

    switch (happVersion.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the happ version")}
          .error=${happVersion.error}
        ></display-error>`;
      case "completed":
        return this.renderSummary(happVersion.value);
    }
  }

  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() =>
      this.dispatchEvent(
        new CustomEvent("happ-version-selected", {
          composed: true,
          bubbles: true,
          detail: {
            happVersionHash: this.happVersionHash,
          },
        }),
      )}>
      ${this.renderHappVersion()}
    </sl-card>`;
  }

  static styles = appStyles;
}
