import '@darksoil-studio/file-storage-zome/dist/elements/upload-files.js';
import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import {
	hashProperty,
	hashState,
	notifyError,
	onSubmit,
	sharedStyles,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import { SignalWatcher, toPromise } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { HappRelease } from '../types.js';

/**
 * @element edit-happ-release
 * @fires happ-release-updated: detail will contain { originalHappReleaseHash, previousHappReleaseHash, updatedHappReleaseHash }
 */
@localized()
@customElement('edit-happ-release')
export class EditHappRelease extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the original `Create` action for this HappRelease
	 */
	@property(hashProperty('happ-release-hash'))
	happReleaseHash!: ActionHash;

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
		const currentRecord = await toPromise(
			this.happsStore.happReleases.get(this.happReleaseHash).latestVersion,
		);
		setTimeout(() => {
			(this.shadowRoot?.getElementById('form') as HTMLFormElement).reset();
		});
	}

	async updateHappRelease(
		currentRecord: EntryRecord<HappRelease>,
		fields: Partial<HappRelease>,
	) {
		const happRelease: HappRelease = {
			happ_hash: currentRecord.entry.happ_hash!,
			version: currentRecord.entry.version!,
			changes: fields.changes!,
			web_happ_bundle_hash: currentRecord.entry.web_happ_bundle_hash!,
		};

		try {
			this.committing = true;
			const updateRecord = await this.happsStore.client.updateHappRelease(
				this.happReleaseHash,
				currentRecord.actionHash,
				happRelease,
			);

			this.dispatchEvent(
				new CustomEvent('happ-release-updated', {
					composed: true,
					bubbles: true,
					detail: {
						originalHappReleaseHash: this.happReleaseHash,
						previousHappReleaseHash: currentRecord.actionHash,
						updatedHappReleaseHash: updateRecord.actionHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error updating the happ version'));
		}

		this.committing = false;
	}

	renderEditForm(currentRecord: EntryRecord<HappRelease>) {
		return html` <sl-card style="flex: 1">
			<form
				id="form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields => this.updateHappRelease(currentRecord, fields))}
			>
				<span class="title">${msg('Edit Changes')}</span>
				<sl-textarea
					name="changes"
					.label=${msg('Changes')}
					required
					.defaultValue=${currentRecord.entry.changes}
				></sl-textarea>

				<div class="row" style="gap: 8px;">
					<sl-button
						@click=${() =>
							this.dispatchEvent(
								new CustomEvent('edit-canceled', {
									bubbles: true,
									composed: true,
								}),
							)}
						style="flex: 1;"
						>${msg('Cancel')}</sl-button
					>
					<sl-button
						type="submit"
						variant="primary"
						style="flex: 1;"
						.loading=${this.committing}
						>${msg('Save')}</sl-button
					>
				</div>
			</form>
		</sl-card>`;
	}

	render() {
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
				return this.renderEditForm(happRelease.value);
		}
	}

	static styles = happsStyles;
}
