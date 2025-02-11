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
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import './happ-summary.js';

/**
 * @element publisher-happs
 */
@localized()
@customElement('publisher-happs')
export class PublisherHapps extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The author for which the Happs should be fetched
	 */
	@property(hashProperty('author'))
	author!: AgentPubKey;

	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	firstUpdated() {
		if (this.author === undefined) {
			throw new Error(
				`The author property is required for the PublisherHapps element`,
			);
		}
	}

	renderList(hashes: Array<ActionHash>) {
		if (hashes.length === 0) {
			return html` <div
				class="column center-content"
				style="gap: 16px; flex: 1"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="color: grey; height: 64px; width: 64px;"
				></sl-icon>
				<span class="placeholder">${msg('No hApps found.')}</span>
			</div>`;
		}

		return html`
			<div class="row" style="gap: 16px; flex: 1; flex-wrap: wrap">
				${hashes.map(
					hash => html`<happ-summary .happHash=${hash}></happ-summary>`,
				)}
			</div>
		`;
	}

	render() {
		const map = this.happsStore.publisherHapps.get(this.author).get();

		switch (map.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the happs')}
					.error=${map.error}
				></display-error>`;
			case 'completed':
				return this.renderList(Array.from(map.value.keys()));
		}
	}

	static styles = [
		sharedStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
