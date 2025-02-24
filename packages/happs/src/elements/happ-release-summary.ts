import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { hashProperty, sharedStyles } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { HappRelease } from '../types.js';

/**
 * @element happ-release-summary
 * @fires happ-release-selected: detail will contain { happReleaseHash }
 */
@localized()
@customElement('happ-release-summary')
export class HappReleaseSummary extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the HappRelease to show
	 */
	@property(hashProperty('happ-release-hash'))
	happReleaseHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	renderSummary(entryRecord: EntryRecord<HappRelease>) {
		return html`
			<div class="row" style="gap: 16px; flex: 1">
				<span>${entryRecord.entry.version}</span>
				<div style="flex: 1"></div>
				<sl-format-date
					class="placeholder"
					.date=${new Date(entryRecord.action.timestamp)}
				></sl-format-date>
			</div>
		`;
	}

	renderHappRelease() {
		const happRelease = this.happsStore.happReleases
			.get(this.happReleaseHash)
			.latestVersion.get();

		switch (happRelease.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the happ version')}
					.error=${happRelease.error}
				></display-error>`;
			case 'completed':
				return this.renderSummary(happRelease.value);
		}
	}

	render() {
		return html`<sl-card
			style="flex: 1; cursor: grab;"
			@click=${() =>
				this.dispatchEvent(
					new CustomEvent('happ-release-selected', {
						composed: true,
						bubbles: true,
						detail: {
							happReleaseHash: this.happReleaseHash,
						},
					}),
				)}
		>
			${this.renderHappRelease()}
		</sl-card>`;
	}

	static styles = happsStyles;
}
