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
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
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
import { happsStyles } from '../styles.js';
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

	renderPublishedStatus() {
		const unpublishedLinks = this.happsStore.happs
			.get(this.happHash)
			.unpublishedLinks.get();

		switch (unpublishedLinks.status) {
			case 'pending':
				return html` <sl-skeleton effect="pulse"></sl-skeleton> `;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the published status.')}
					.error=${unpublishedLinks.error}
				></display-error>`;
			case 'completed':
				const isPublished = unpublishedLinks.value.length == 0;

				return html`
					<sl-card>
						<div class="column" style="flex: 1; gap: 16px">
							<div class="row" style="align-items: center; gap: 8px">
								<span class="title">${msg('Status')}:</span>
								<span
									>${isPublished
										? html`<sl-tag variant="success"
												>${msg('Published')}</sl-tag
											> `
										: html`<sl-tag variant="danger"
												>${msg('Unpublished')}</sl-tag
											>`}</span
								>
								<span style="flex: 1"></span>
								${isPublished
									? html`
											<sl-dialog .label=${msg('Unpublish hApp')}>
												<span
													>${msg(
														'Are you sure you want to unpublish this hApp?',
													)}
												</span>
												<span
													>${msg(
														'Users will not be able to install the hApp anymore.',
													)}
												</span>
												<sl-button
													slot="footer"
													@click=${() => {
														this.shadowRoot?.querySelector('sl-dialog')!.hide();
													}}
													>${msg('Cancel')}
												</sl-button>
												<sl-button
													slot="footer"
													variant="danger"
													@click=${(e: CustomEvent) => {
														const button = e.target as SlButton;
														button.loading = true;
														this.happsStore.client
															.unpublishHapp(this.happHash)
															.catch(e => {
																notifyError(msg('Error unpublishing hApp.'));
																console.error(e);
															})
															.finally(() => {
																button.loading = false;
															});
													}}
													>${msg('Unpublish')}
												</sl-button>
											</sl-dialog>
											<sl-button
												outline
												variant="danger"
												@click=${() => {
													this.shadowRoot?.querySelector('sl-dialog')!.show();
												}}
												>${msg('Unpublish')}
											</sl-button>
										`
									: html`
											<sl-dialog .label=${msg('Publish hApp')}>
												<span
													>${msg('Are you sure you want to publish this hApp?')}
												</span>
												<span
													>${msg('All users will be able to install the hApp.')}
												</span>
												<sl-button
													slot="footer"
													@click=${() => {
														this.shadowRoot?.querySelector('sl-dialog')!.hide();
													}}
													>${msg('Cancel')}
												</sl-button>
												<sl-button
													slot="footer"
													variant="primary"
													@click=${(e: CustomEvent) => {
														const button = e.target as SlButton;
														button.loading = true;
														this.happsStore.client
															.republishHapp(this.happHash)
															.catch(e => {
																notifyError(msg('Error publishing hApp.'));
																console.error(e);
															})
															.finally(() => {
																button.loading = false;
															});
													}}
													>${msg('Publish')}
												</sl-button>
											</sl-dialog>
											<sl-button
												outline
												variant="success"
												@click=${() => {
													this.shadowRoot?.querySelector('sl-dialog')!.show();
												}}
												>${msg('Publish')}
											</sl-button>
										`}
							</div>

							<div class="column" style="gap: 8px;">
								<span
									>${isPublished
										? msg('Users are be able to download and install the hApp.')
										: msg(
												'Users are not be able to download and install the hApp.',
											)}
								</span>
							</div>
						</div>
					</sl-card>
				`;
		}
	}

	renderDetail(entryRecord: EntryRecord<Happ>) {
		return html`
			<div class="column" style="gap: 16px;">
				<sl-card>
					<div class="column" style="gap: 16px; flex: 1">
						<div class="row" style="gap: 16px; flex: 1">
							<show-image
								.imageHash=${entryRecord.entry.icon}
								style="width: 64px; height: 64px"
							></show-image>
							<span style="flex: 1"></span>
							<sl-icon-button
								.src=${wrapPathInSvg(mdiPencil)}
								@click=${() => {
									this._editing = true;
								}}
							></sl-icon-button>
						</div>

						<span class="title">${entryRecord.entry.name}</span>

						<span style="white-space: pre-line"
							>${entryRecord.entry.description}</span
						>
					</div>
				</sl-card>

				${this.renderPublishedStatus()}

				<div class="column" style="margin-top: 16px">
					<div class="row" style="align-items: center">
						<span class="title">${msg('Releases')}</span>
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
							>${msg('New Release')}</sl-button
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

	static styles = happsStyles;
}
