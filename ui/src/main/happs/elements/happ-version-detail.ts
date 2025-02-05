import {
	FileStorageClient,
	fileStorageClientContext,
} from '@darksoil-studio/file-storage-zome';
import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import {
	mdiAlertCircleOutline,
	mdiDelete,
	mdiDownload,
	mdiPencil,
} from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	hashProperty,
	notifyError,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from '../../../app-styles.js';
import { triggerFileDownload } from '../../../utils.js';
import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { HappVersion } from '../types.js';
import './edit-happ-version.js';

/**
 * @element happ-version-detail
 * @fires happ-version-deleted: detail will contain { happVersionHash }
 */
@localized()
@customElement('happ-version-detail')
export class HappVersionDetail extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the HappVersion to show
	 */
	@property(hashProperty('happ-version-hash'))
	happVersionHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	@consume({ context: fileStorageClientContext, subscribe: true })
	private fileStorageClient!: FileStorageClient;

	/**
	 * @internal
	 */
	@state()
	_editing = false;

	@state()
	downloading = false;

	renderDetail(entryRecord: EntryRecord<HappVersion>) {
		return html`
			<sl-card>
				<div class="column" style="gap: 16px; flex: 1">
					<div class="row" style="gap: 16px; align-items: center">
						<span class="title">${entryRecord.entry.version}</span>
						<span style="flex: 1"> </span>
						<sl-button
							.loading=${this.downloading}
							@click=${async () => {
								try {
									this.downloading = true;

									await triggerFileDownload(
										entryRecord.entry.web_happ_bundle_hash,
										this.fileStorageClient,
									);
								} catch (e) {
									notifyError(msg('Error downloading file.'));
									console.error(e);
								}
								this.downloading = false;
							}}
							variant="primary"
						>
							<sl-icon
								slot="prefix"
								.src=${wrapPathInSvg(mdiDownload)}
							></sl-icon>
							${msg('Download Bundle')}</sl-button
						>
					</div>

					<div class="column" style="gap: 8px;">
						<div class="row" style="gap: 8px; align-items: center">
							<span><strong>${msg('Changes')}</strong></span>

							<sl-icon-button
								.src=${wrapPathInSvg(mdiPencil)}
								@click=${() => {
									this._editing = true;
								}}
							></sl-icon-button>
						</div>
						<span style="white-space: pre-line"
							>${entryRecord.entry.changes}</span
						>
					</div>
				</div>
			</sl-card>
		`;
	}

	render() {
		const happVersion = this.happsStore.happVersions
			.get(this.happVersionHash)
			.latestVersion.get();

		switch (happVersion.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the happ version')}
					.error=${happVersion.error}
				></display-error>`;
			case 'completed':
				if (this._editing) {
					return html`<edit-happ-version
						.happVersionHash=${this.happVersionHash}
						@happ-version-updated=${async () => {
							this._editing = false;
						}}
						@edit-canceled=${() => {
							this._editing = false;
						}}
						style="display: flex; flex: 1;"
					></edit-happ-version>`;
				}

				return this.renderDetail(happVersion.value);
		}
	}

	static styles = appStyles;
}
