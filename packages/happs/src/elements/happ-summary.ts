import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { hashProperty, sharedStyles } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { Happ } from '../types.js';

/**
 * @element happ-summary
 * @fires happ-selected: detail will contain { happHash }
 */
@localized()
@customElement('happ-summary')
export class HappSummary extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the Happ to show
	 */
	@property(hashProperty('happ-hash'))
	happHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	renderSummary(entryRecord: EntryRecord<Happ>) {
		return html`
			<div class="column" style="gap: 16px;">
				<div class="row" style="gap: 16px;">
					<show-image
						.imageHash=${entryRecord.entry.icon}
						style="width: 64px; height: 64px;"
					></show-image>
					<div style="flex: 1"></div>
				</div>
				<div class="column" style="gap: 8px;">
					<span>${entryRecord.entry.name}</span>

					<span class="placeholder">${entryRecord.entry.description}</span>
				</div>
			</div>
		`;
	}

	renderHapp() {
		const happ = this.happsStore.happs.get(this.happHash).latestVersion.get();

		switch (happ.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the happ')}
					.error=${happ.error}
				></display-error>`;
			case 'completed':
				return this.renderSummary(happ.value);
		}
	}

	render() {
		return html`<sl-card
			style="flex: 1; cursor: grab;"
			@click=${() =>
				this.dispatchEvent(
					new CustomEvent('happ-selected', {
						composed: true,
						bubbles: true,
						detail: {
							happHash: this.happHash,
						},
					}),
				)}
		>
			${this.renderHapp()}
		</sl-card>`;
	}

	static styles = sharedStyles;
}
