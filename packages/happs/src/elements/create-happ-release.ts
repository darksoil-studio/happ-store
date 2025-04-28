import '@darksoil-studio/file-storage-zome/dist/elements/upload-files.js';
import {
	ActionHash,
	AgentPubKey,
	DnaHash,
	EntryHash,
	Record,
} from '@holochain/client';
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
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { HappRelease } from '../types.js';

/**
 * @element create-happ-release
 * @fires happ-release-created: detail will contain { happReleaseHash }
 */
@localized()
@customElement('create-happ-release')
export class CreateHappRelease extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The happ hash for this HappRelease
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
	committing = false;

	/**
	 * @internal
	 */
	@query('#create-form')
	form!: HTMLFormElement;

	async createHappRelease(fields: Partial<HappRelease>) {
		if (this.happHash === undefined)
			throw new Error(
				'Cannot create a new hApp Release without its happ_hash field',
			);

		const happRelease: HappRelease = {
			happ_hash: this.happHash!,
			version: fields.version!,
			changes: fields.changes!,
			web_happ_bundle_hash: fields.web_happ_bundle_hash!,
		};

		try {
			this.committing = true;
			const record: EntryRecord<HappRelease> =
				await this.happsStore.client.createHappRelease(happRelease);

			this.dispatchEvent(
				new CustomEvent('happ-release-created', {
					composed: true,
					bubbles: true,
					detail: {
						happReleaseHash: record.actionHash,
					},
				}),
			);

			this.form.reset();
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error creating the happ version'));
		}
		this.committing = false;
	}

	render() {
		return html` <sl-card style="flex: 1;">
			<form
				id="create-form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields => this.createHappRelease(fields))}
			>
				<span>${msg('Web hApp Bundle')}*</span>
				<upload-files
					name="web_happ_bundle_hash"
					one-file
					accepted-files=".webhapp"
					required
				></upload-files>
				<sl-input name="version" .label=${msg('Version')} required></sl-input>
				<sl-textarea
					name="changes"
					.label=${msg('Changes')}
					required
				></sl-textarea>

				<sl-button variant="primary" type="submit" .loading=${this.committing}
					>${msg('Create hApp Release')}</sl-button
				>
			</form>
		</sl-card>`;
	}

	static styles = happsStyles;
}
