import { ActionHash, AgentPubKey, DnaHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";
import { hashProperty, hashState, notifyError, onSubmit, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@darksoil-studio/file-storage-zome/dist/elements/upload-files.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@tnesh-stack/elements/dist/elements/display-error.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import { appStyles } from "../../../app-styles.js";
import { happsStoreContext } from "../context.js";
import { HappsStore } from "../happs-store.js";
import { Happ } from "../types.js";

/**
 * @element create-happ
 * @fires happ-created: detail will contain { happHash }
 */
@localized()
@customElement("create-happ")
export class CreateHapp extends SignalWatcher(LitElement) {
  /**
   * @internal
   */
  @consume({ context: happsStoreContext, subscribe: true })
  happsStore!: HappsStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query("#create-form")
  form!: HTMLFormElement;

  async createHapp(fields: Partial<Happ>) {
    const happ: Happ = {
      name: fields.name!,
      description: fields.description!,
      icon: fields.icon!,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Happ> = await this.happsStore.client.createHapp(happ);

      this.dispatchEvent(
        new CustomEvent("happ-created", {
          composed: true,
          bubbles: true,
          detail: {
            happHash: record.actionHash,
          },
        }),
      );

      this.form.reset();
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error creating the happ"));
    }
    this.committing = false;
  }

  render() {
    return html`
      <sl-card style="flex: 1;">
        <span slot="header">${msg("Create Happ")}</span>

        <form 
          id="create-form"
          class="column"
          style="flex: 1; gap: 16px;"
          ${onSubmit(fields => this.createHapp(fields))}
        >  
          <sl-input name="name" .label=${msg("Name")}  required></sl-input>
          <sl-textarea name="description" .label=${msg("Description")}  required></sl-textarea>
          <upload-files name="icon" one-file accepted-files="image/jpeg,image/png,image/gif" required></upload-files>

          <sl-button
            variant="primary"
            type="submit"
            .loading=${this.committing}
          >${msg("Create Happ")}</sl-button>
        </form> 
      </sl-card>`;
  }

  static styles = appStyles;
}
