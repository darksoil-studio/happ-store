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
} from '@tnesh-stack/elements';
import { SignalWatcher, toPromise } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { HappVersion } from '../types.js';

/**
 * @element edit-happ-version
 * @fires happ-version-updated: detail will contain { originalHappVersionHash, previousHappVersionHash, updatedHappVersionHash }
 */
@localized()
@customElement('edit-happ-version')
export class EditHappVersion extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the original `Create` action for this HappVersion
	 */
	@property(hashProperty('happ-version-hash'))
	happVersionHash!: ActionHash;

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
			this.happsStore.happVersions.get(this.happVersionHash).latestVersion,
		);
		setTimeout(() => {
			(this.shadowRoot?.getElementById('form') as HTMLFormElement).reset();
		});
	}

	async updateHappVersion(
		currentRecord: EntryRecord<HappVersion>,
		fields: Partial<HappVersion>,
	) {
		const happVersion: HappVersion = {
			happ_hash: currentRecord.entry.happ_hash!,
			version: currentRecord.entry.version!,
			changes: fields.changes!,
			web_happ_bundle_hash: currentRecord.entry.web_happ_bundle_hash!,
		};

		try {
			this.committing = true;
			const updateRecord = await this.happsStore.client.updateHappVersion(
				this.happVersionHash,
				currentRecord.actionHash,
				happVersion,
			);

			this.dispatchEvent(
				new CustomEvent('happ-version-updated', {
					composed: true,
					bubbles: true,
					detail: {
						originalHappVersionHash: this.happVersionHash,
						previousHappVersionHash: currentRecord.actionHash,
						updatedHappVersionHash: updateRecord.actionHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error updating the happ version'));
		}

		this.committing = false;
	}

	renderEditForm(currentRecord: EntryRecord<HappVersion>) {
		return html` <sl-card style="flex: 1">
			<form
				id="form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields => this.updateHappVersion(currentRecord, fields))}
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
				return this.renderEditForm(happVersion.value);
		}
	}

	static styles = happsStyles;
}
