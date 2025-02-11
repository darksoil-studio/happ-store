import { AppClient } from "@holochain/client";
import { consume, provide } from "@lit/context";
import { appClientContext } from "@tnesh-stack/elements";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { happsStoreContext } from "../context.js";
import { HappsClient } from "../happs-client.js";
import { HappsStore } from "../happs-store.js";

/**
 * @element happs-context
 */
@customElement("happs-context")
export class HappsContext extends LitElement {
  @consume({ context: appClientContext })
  private client!: AppClient;

  @provide({ context: happsStoreContext })
  @property({ type: Object })
  store!: HappsStore;

  @property()
  role!: string;

  @property()
  zome = "happs";

  connectedCallback() {
    super.connectedCallback();
    if (this.store) return;
    if (!this.role) {
      throw new Error(`<happs-context> must have a role="YOUR_DNA_ROLE" property, eg: <happs-context role="role1">`);
    }
    if (!this.client) {
      throw new Error(`<happs-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <happs-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <happs-context .store=\${store}>)
      `);
    }

    this.store = new HappsStore(new HappsClient(this.client, this.role, this.zome));
  }

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
