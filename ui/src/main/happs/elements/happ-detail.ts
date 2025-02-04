import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from "@mdi/js";
import { hashProperty, notifyError, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";

import "@tnesh-stack/elements/dist/elements/display-error.js";
import { appStyles } from "../../../app-styles.js";
import "./edit-happ.js";

import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { Happ } from "../types.js";

/**
 * @element happ-detail
 * @fires happ-deleted: detail will contain { happHash }
 */
@localized()
@customElement("happ-detail")
export class HappDetail extends SignalWatcher(LitElement) {
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

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteHapp() {
    try {
      await this.happsStore.client.deleteHapp(this.happHash);

      this.dispatchEvent(
        new CustomEvent("happ-deleted", {
          bubbles: true,
          composed: true,
          detail: {
            happHash: this.happHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error deleting the happ"));
    }
  }

  renderDetail(entryRecord: EntryRecord<Happ>) {
    return html`
      <sl-card>
      	<div slot="header" class="row" style="gap: 8px">
          <span style="font-size: 18px; flex: 1;">${msg("Happ")}</span>

          <sl-icon-button .src=${wrapPathInSvg(mdiPencil)} @click=${() => {
      this._editing = true;
    }}></sl-icon-button>
          <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteHapp()}></sl-icon-button>
        </div>

        <div class="column" style="gap: 16px;">
  
          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Name")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.name}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Description")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.description}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Icon")}</strong></span>
 	        <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.icon} style="width: 300px; height: 200px"></show-image></span>
	  </div>

      </div>
      </sl-card>
    `;
  }

  render() {
    const happ = this.happsStore.happs.get(this.happHash).latestVersion.get();

    switch (happ.status) {
      case "pending":
        return html`<div
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the happ")}
          .error=${happ.error}
        ></display-error>`;
      case "completed":
        if (this._editing) {
          return html`<edit-happ
      	    .happHash=${this.happHash}
            @happ-updated=${async () => {
            this._editing = false;
          }}
    	    @edit-canceled=${() => {
            this._editing = false;
          }}
      	    style="display: flex; flex: 1;"
      	  ></edit-happ>`;
        }

        return this.renderDetail(happ.value);
    }
  }

  static styles = appStyles;
}
