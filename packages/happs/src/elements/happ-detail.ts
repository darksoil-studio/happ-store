import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import {
	ActionHash,
	EntryHash,
	Record,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	Routes,
	hashProperty,
	notifyError,
	sharedStyles,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { Happ } from '../types.js';
import './create-happ-version.js';
import './edit-happ.js';
import './happ-version-detail.js';
import './happ-versions-for-happ.js';

/**
 * @element happ-detail
 * @fires happ-deleted: detail will contain { happHash }
 */
@localized()
@customElement('happ-detail')
export class HappDetail extends SignalWatcher(LitElement) {
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

	/**
	 * @internal
	 */
	@state()
	_editing = false;

	async deleteHapp() {
		try {
			await this.happsStore.client.deleteHapp(this.happHash);

			this.dispatchEvent(
				new CustomEvent('happ-deleted', {
					bubbles: true,
					composed: true,
					detail: {
						happHash: this.happHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error deleting the happ'));
		}
	}

	renderDetail(entryRecord: EntryRecord<Happ>) {
		return html`
			<div class="column" style="gap: 32px;">
				<sl-card>
					<div class="row" style="gap: 16px; flex: 1">
						<show-image
							.imageHash=${entryRecord.entry.icon}
							style="width: 64px; height: 64px"
						></show-image>

						<div class="column" style="gap: 16px; flex: 1">
							<span class="title">${entryRecord.entry.name}</span>

							<span style="white-space: pre-line"
								>${entryRecord.entry.description}</span
							>
						</div>

						<sl-icon-button
							.src=${wrapPathInSvg(mdiPencil)}
							@click=${() => {
								this._editing = true;
							}}
						></sl-icon-button>
					</div>
				</sl-card>

				<div class="column">
					<div class="row" style="align-items: center">
						<span class="title">${msg('Versions')}</span>
						<div style="flex: 1"></div>
						<sl-button
							variant="primary"
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('new-happ-version-selected', {
										bubbles: true,
										composed: true,
									}),
								)}
							>${msg('New Version')}</sl-button
						>
					</div>

					<sl-divider> </sl-divider>

					<happ-versions-for-happ .happHash=${this.happHash}>
					</happ-versions-for-happ>
				</div>
			</div>
		`;
	}

	render() {
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

	static styles = sharedStyles;
}
