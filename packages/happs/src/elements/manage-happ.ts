import {
	FileStorageClient,
	fileStorageClientContext,
} from '@darksoil-studio/file-storage-zome';
import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import {
	ActionHash,
	EntryHash,
	Record,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { isAsyncIterable } from '@msgpack/msgpack/dist/utils/stream.js';
import { SlButton } from '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { hashProperty, notifyError, sharedStyles } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import {
	SignalWatcher,
	fromPromise,
	joinAsync,
	joinAsyncMap,
} from '@tnesh-stack/signals';
import { EntryRecord, mapValues } from '@tnesh-stack/utils';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { WebAppBundle, installWebHapp, openHapp } from '../commands.js';
import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { Happ, HappVersion } from '../types.js';
import { decodeBundle, installedApps } from '../utils.js';

/**
 * @element manage-happ
 * @fires happ-selected: detail will contain { happHash }
 */
@localized()
@customElement('manage-happ')
export class ManageHapp extends SignalWatcher(LitElement) {
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

	@consume({ context: fileStorageClientContext, subscribe: true })
	private fileStorageClient!: FileStorageClient;

	versions() {
		const versions = this.happsStore.happs
			.get(this.happHash)
			.happVersions.get();
		if (versions.status !== 'completed') return versions;

		const originalVersions = joinAsyncMap(
			mapValues(versions.value, version => version.original.get()),
		);
		return originalVersions;
	}

	installedVersion() {
		const versions = this.versions();
		const apps = installedApps.signal.get();
		if (versions.status !== 'completed') return versions;
		if (apps.status !== 'completed') return apps;

		const sortedVersions = Array.from(versions.value.entries()).sort(
			(v1, v2) => v2[1].action.timestamp - v1[1].action.timestamp,
		);

		const isInstalled = (versionHash: ActionHash) =>
			!!apps.value.find(
				app => app.installed_app_id === encodeHashToBase64(versionHash),
			);

		const latestVersion = sortedVersions[0];

		return {
			status: 'completed' as const,
			value: {
				latestVersion,
				isInstalled: isInstalled(latestVersion[0]),
			},
		};
	}

	async install(
		happVersionHash: ActionHash,
		happVersion: EntryRecord<HappVersion>,
	) {
		try {
			const file = await this.fileStorageClient.downloadFile(
				happVersion.entry.web_happ_bundle_hash,
			);
			const bundle: WebAppBundle = await decodeBundle(file);
			await installWebHapp(
				encodeHashToBase64(happVersionHash),
				bundle,
				undefined,
				undefined,
			);
			installedApps.reload();
		} catch (e) {
			notifyError(msg('Error installing the hApp'));
			console.error(e);
		}
	}

	async open(happ: EntryRecord<Happ>, happVersionHash: ActionHash) {
		try {
			await openHapp(encodeHashToBase64(happVersionHash), happ.entry.name);
		} catch (e) {
			notifyError(msg('Error opening the hApp'));
			console.error(e);
		}
	}

	renderAction(
		happ: EntryRecord<Happ>,
		latestVersion: [ActionHash, EntryRecord<HappVersion>],
		isInstalled: boolean,
	) {
		if (isInstalled)
			return html`
				<sl-button
					variant="success"
					outlined
					@click=${() => this.open(happ, latestVersion[0])}
					>${msg('Open')}
				</sl-button>
			`;
		return html`
			<sl-button
				variant="primary"
				outlined
				@click=${(e: Event) => {
					const button = e.target as SlButton;
					button.loading = true;
					this.install(latestVersion[0], latestVersion[1]).finally(() => {
						button.loading = false;
					});
				}}
				>${msg('Install')}
			</sl-button>
		`;
	}

	renderSummary(
		happ: EntryRecord<Happ>,
		latestVersion: [ActionHash, EntryRecord<HappVersion>],
		isInstalled: boolean,
	) {
		return html`
			<div class="column" style="gap: 16px;">
				<div class="row" style="gap: 16px;">
					<show-image
						.imageHash=${happ.entry.icon}
						style="width: 64px; height: 64px;"
					></show-image>
					<div style="flex: 1"></div>

					${this.renderAction(happ, latestVersion, isInstalled)}
				</div>
				<div class="column" style="gap: 8px;">
					<span>${happ.entry.name}</span>

					<span class="placeholder">${happ.entry.description}</span>
				</div>
			</div>
		`;
	}

	renderHapp() {
		const happ = joinAsync([
			this.happsStore.happs.get(this.happHash).latestVersion.get(),
			this.installedVersion(),
		]);

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
				return this.renderSummary(
					happ.value[0],
					happ.value[1].latestVersion,
					happ.value[1].isInstalled,
				);
		}
	}

	render() {
		return html`<sl-card
			style="flex: 1; cursor: grab;"
			@click=${() =>
				this.dispatchEvent(
					new CustomEvent('happ-selected', {
						composed: true,
						bubbles: true,
						detail: {
							happHash: this.happHash,
						},
					}),
				)}
		>
			${this.renderHapp()}
		</sl-card>`;
	}

	static styles = sharedStyles;
}
