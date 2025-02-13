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
import { mdiDelete, mdiDownload, mdiOpenInNew } from '@mdi/js';
import { isAsyncIterable } from '@msgpack/msgpack/dist/utils/stream.js';
import { SlButton } from '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	hashProperty,
	notify,
	notifyError,
	sharedStyles,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import {
	SignalWatcher,
	fromPromise,
	joinAsync,
	joinAsyncMap,
} from '@tnesh-stack/signals';
import { EntryRecord, mapValues } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
	WebAppBundle,
	installWebHapp,
	openHapp,
	uninstallWebHapp,
} from '../commands.js';
import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import { Happ, HappVersion } from '../types.js';
import { decodeBundle, installedApps } from '../utils.js';

function happId(happVersionHash: ActionHash): string {
	return encodeHashToBase64(happVersionHash).slice(5, 15);
}

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
			!!apps.value.find(app => app.installed_app_id === happId(versionHash));

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
				happId(happVersionHash),
				bundle,
				undefined,
				undefined,
			);
			installedApps.reload();
			notify(msg('hApp installed successfully.'));
		} catch (e) {
			notifyError(msg('Error installing the hApp'));
			console.error(e);
		}
	}

	async uninstall(happVersionHash: ActionHash) {
		try {
			await uninstallWebHapp(happId(happVersionHash));
			installedApps.reload();
			notify(msg('hApp uninstalled successfully.'));
		} catch (e) {
			notifyError(msg('Error uninstalling the hApp'));
			console.error(e);
		}
	}

	async open(happ: EntryRecord<Happ>, happVersionHash: ActionHash) {
		try {
			await openHapp(happId(happVersionHash), happ.entry.name);
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
				<div class="row" style="gap: 8px">
					<sl-button
						@click=${() => this.open(happ, latestVersion[0])}
						circle
						outline
					>
						<sl-icon .src=${wrapPathInSvg(mdiOpenInNew)}></sl-icon>
					</sl-button>
					<sl-dialog .label=${msg('Uninstall hApp')}>
						<span>${msg('Are you sure you want to uninstall this app?')} </span>
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
								this.uninstall(latestVersion[0]).finally(
									() => (button.loading = false),
								);
							}}
							>${msg('Uninstall')}
						</sl-button>
					</sl-dialog>
					<sl-button
						@click=${() => {
							this.shadowRoot?.querySelector('sl-dialog')!.show();
						}}
						circle
						outline
						variant="danger"
					>
						<sl-icon .src=${wrapPathInSvg(mdiDelete)}></sl-icon>
					</sl-button>
				</div>
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
			>
				<sl-icon slot="prefix" .src=${wrapPathInSvg(mdiDownload)}> </sl-icon>

				${msg('Install')}
			</sl-button>
		`;
	}

	renderSummary(
		happ: EntryRecord<Happ>,
		latestVersion: [ActionHash, EntryRecord<HappVersion>],
		isInstalled: boolean,
	) {
		return html`
			<div class="column" style="gap: 16px; flex: 1">
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

					<span
						class="placeholder"
						style="text-overflow: ellipsis; height: 56px; overflow: hidden"
						>${happ.entry.description}</span
					>
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

	static styles = [
		happsStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
