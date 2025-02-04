import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";
import { hashProperty, hashState, notifyError, onSubmit, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher, toPromise } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@darksoil-studio/file-storage-zome/dist/elements/upload-files.js";

import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import { appStyles } from "../../../app-styles.js";
import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { HappVersion } from "../types.js";

/**
 * @element edit-happ-version
 * @fires happ-version-updated: detail will contain { originalHappVersionHash, previousHappVersionHash, updatedHappVersionHash }
 */
@localized()
@customElement("edit-happ-version")
export class EditHappVersion extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the original `Create` action for this HappVersion
   */
  @property(hashProperty("happ-version-hash"))
  happVersionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: happsStoreContext })
  happsStore!: HappsStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  async firstUpdated() {
    const currentRecord = await toPromise(this.happsStore.happVersions.get(this.happVersionHash).latestVersion);
    setTimeout(() => {
      (this.shadowRoot?.getElementById("form") as HTMLFormElement).reset();
    });
  }

  async updateHappVersion(currentRecord: EntryRecord<HappVersion>, fields: Partial<HappVersion>) {
    const happVersion: HappVersion = {
      happ_hash: currentRecord.entry.happ_hash!,
      version: fields.version!,
      changes: fields.changes!,
      web_happ_bundle_hash: fields.web_happ_bundle_hash!,
    };

    try {
      this.committing = true;
      const updateRecord = await this.happsStore.client.updateHappVersion(
        this.happVersionHash,
        currentRecord.actionHash,
        happVersion,
      );

      this.dispatchEvent(
        new CustomEvent("happ-version-updated", {
          composed: true,
          bubbles: true,
          detail: {
            originalHappVersionHash: this.happVersionHash,
            previousHappVersionHash: currentRecord.actionHash,
            updatedHappVersionHash: updateRecord.actionHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error updating the happ version"));
    }

    this.committing = false;
  }

  renderEditForm(currentRecord: EntryRecord<HappVersion>) {
    return html`
      <sl-card>
        <span slot="header">${msg("Edit Happ Version")}</span>

        <form
          id="form"
          class="column"
          style="flex: 1; gap: 16px;"
          ${onSubmit(fields => this.updateHappVersion(currentRecord, fields))}
        >  
        <sl-input name="version" .label=${
      msg("Version")
    }  required .defaultValue=${currentRecord.entry.version}></sl-input>
        <sl-textarea name="changes" .label=${
      msg("Changes")
    }  required .defaultValue=${currentRecord.entry.changes}></sl-textarea>
        <upload-files name="web_happ_bundle_hash" one-file accepted-files="image/jpeg,image/png,image/gif" required .defaultValue=${currentRecord.entry.web_happ_bundle_hash}></upload-files>

          <div class="row" style="gap: 8px;">
            <sl-button
              @click=${() =>
      this.dispatchEvent(
        new CustomEvent("edit-canceled", {
          bubbles: true,
          composed: true,
        }),
      )}
              style="flex: 1;"
            >${msg("Cancel")}</sl-button>
            <sl-button
              type="submit"
              variant="primary"
              style="flex: 1;"
              .loading=${this.committing}
            >${msg("Save")}</sl-button>

          </div>
        </form>
      </sl-card>`;
  }

  render() {
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
        return this.renderEditForm(happVersion.value);
    }
  }

  static styles = appStyles;
}
