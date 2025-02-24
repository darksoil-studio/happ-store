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
import { Happ } from '../types.js';

/**
 * @element edit-happ
 * @fires happ-updated: detail will contain { originalHappHash, previousHappHash, updatedHappHash }
 */
@localized()
@customElement('edit-happ')
export class EditHapp extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the original `Create` action for this Happ
	 */
	@property(hashProperty('happ-hash'))
	happHash!: ActionHash;

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
			this.happsStore.happs.get(this.happHash).latestVersion,
		);
		setTimeout(() => {
			(this.shadowRoot?.getElementById('form') as HTMLFormElement).reset();
		});
	}

	async updateHapp(currentRecord: EntryRecord<Happ>, fields: Partial<Happ>) {
		const happ: Happ = {
			name: fields.name!,
			description: fields.description!,
			icon: fields.icon!,
		};

		try {
			this.committing = true;
			const updateRecord = await this.happsStore.client.updateHapp(
				this.happHash,
				currentRecord.actionHash,
				happ,
			);

			this.dispatchEvent(
				new CustomEvent('happ-updated', {
					composed: true,
					bubbles: true,
					detail: {
						originalHappHash: this.happHash,
						previousHappHash: currentRecord.actionHash,
						updatedHappHash: updateRecord.actionHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error updating the happ'));
		}

		this.committing = false;
	}

	renderEditForm(currentRecord: EntryRecord<Happ>) {
		return html` <sl-card style="flex: 1">
			<form
				id="form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields => this.updateHapp(currentRecord, fields))}
			>
				<span class="title">${msg('Edit hApp')}</span>
				<sl-input
					name="name"
					.label=${msg('Name')}
					required
					.defaultValue=${currentRecord.entry.name}
				></sl-input>
				<sl-textarea
					name="description"
					.label=${msg('Description')}
					required
					.defaultValue=${currentRecord.entry.description}
				></sl-textarea>
				<upload-files
					name="icon"
					one-file
					accepted-files="image/jpeg,image/png,image/gif"
					required
					.defaultValue=${currentRecord.entry.icon}
				></upload-files>

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
				return this.renderEditForm(happ.value);
		}
	}

	static styles = happsStyles;
}
