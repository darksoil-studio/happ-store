import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	hashProperty,
	sharedStyles,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { AsyncComputed, SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord, slice } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { HappVersion } from '../types.js';
import './happ-version-summary.js';

/**
 * @element happ-versions-for-happ
 */
@localized()
@customElement('happ-versions-for-happ')
export class HappVersionsForHapp extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The HappHash for which the HappVersions should be fetched
	 */
	@property(hashProperty('happ-hash'))
	happHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	renderList(hashes: Array<ActionHash>) {
		if (hashes.length === 0) {
			return html` <div class="column center-content" style="gap: 16px;">
				<sl-icon
					style="color: grey; height: 64px; width: 64px;"
					.src=${wrapPathInSvg(mdiInformationOutline)}
				></sl-icon>
				<span class="placeholder"
					>${msg('No happ versions found for this happ')}</span
				>
			</div>`;
		}

		return html`
			<div style="display: flex; flex-direction: column; gap: 8px">
				${hashes.map(
					hash =>
						html`<happ-version-summary
							.happVersionHash=${hash}
						></happ-version-summary>`,
				)}
			</div>
		`;
	}

	render() {
		const map = this.happsStore.happs.get(this.happHash).happVersions.get();

		switch (map.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the happ versions')}
					.error=${map.error}
				></display-error>`;
			case 'completed':
				return this.renderList(Array.from(map.value.keys()));
		}
	}

	static styles = happsStyles;
}
