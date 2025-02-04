import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from "@mdi/js";
import { hashProperty, notifyError, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";

import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@tnesh-stack/elements/dist/elements/display-error.js";
import { appStyles } from "../../../app-styles.js";
import "./edit-happ-version.js";

import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { HappVersion } from "../types.js";

/**
 * @element happ-version-detail
 * @fires happ-version-deleted: detail will contain { happVersionHash }
 */
@localized()
@customElement("happ-version-detail")
export class HappVersionDetail extends SignalWatcher(LitElement) {
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

  /**
   * @internal
   */
  @state()
  _editing = false;

  renderDetail(entryRecord: EntryRecord<HappVersion>) {
    return html`
      <sl-card>
      	<div slot="header" class="row" style="gap: 8px">
          <span style="font-size: 18px; flex: 1;">${msg("Happ Version")}</span>

          <sl-icon-button .src=${wrapPathInSvg(mdiPencil)} @click=${() => {
      this._editing = true;
    }}></sl-icon-button>
        </div>

        <div class="column" style="gap: 16px;">
  
          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Version")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.version}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Changes")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.changes}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Web Happ Bundle Hash")}</strong></span>
 	        <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.web_happ_bundle_hash} style="width: 300px; height: 200px"></show-image></span>
	  </div>

      </div>
      </sl-card>
    `;
  }

  render() {
    const happVersion = this.happsStore.happVersions.get(this.happVersionHash).latestVersion.get();

    switch (happVersion.status) {
      case "pending":
        return html`<div
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the happ version")}
          .error=${happVersion.error}
        ></display-error>`;
      case "completed":
        if (this._editing) {
          return html`<edit-happ-version
      	    .happVersionHash=${this.happVersionHash}
            @happ-version-updated=${async () => {
            this._editing = false;
          }}
    	    @edit-canceled=${() => {
            this._editing = false;
          }}
      	    style="display: flex; flex: 1;"
      	  ></edit-happ-version>`;
        }

        return this.renderDetail(happVersion.value);
    }
  }

  static styles = appStyles;
}
