import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { wrapPathInSvg } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher, joinAsync, joinAsyncMap } from '@darksoil-studio/holochain-signals';
import { mapValues, pickBy } from '@darksoil-studio/holochain-utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { happsStoreContext } from '../context.js';
import { HappsStore } from '../happs-store.js';
import { happsStyles } from '../styles.js';
import './manage-happ.js';

/**
 * @element all-happs
 */
@localized()
@customElement('all-happs')
export class AllHapps extends SignalWatcher(LitElement) {
	/**
	 * @internal
	 */
	@consume({ context: happsStoreContext, subscribe: true })
	happsStore!: HappsStore;

	@state()
	layout: 'rows' | 'single-column' = 'rows';

	firstUpdated() {
		new ResizeController(this, {
			callback: () => {
				this.layout =
					this.getBoundingClientRect().width < 600 ? 'single-column' : 'rows';
			},
		});
	}

	renderList(hashes: Array<ActionHash>) {
		if (hashes.length === 0) {
			return html` <div
				class="column center-content"
				style="gap: 16px; flex: 1;"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="color: grey; height: 64px; width: 64px;"
				></sl-icon>
				<span class="placeholder">${msg('No hApps found.')}</span>
			</div>`;
		}

		return html`
			<div class="flex-scrollable-parent">
				<div class="flex-scrollable-container">
					<div class="flex-scrollable-y">
						<div
							class="row"
							style="margin: 16px; gap: 16px; flex: 1; flex-wrap: wrap"
						>
							${hashes.map(
								hash =>
									html`<manage-happ
										style=${styleMap({
											height: '200px',
											width: this.layout === 'rows' ? '300px' : '100%',
										})}
										.happHash=${hash}
									></manage-happ>`,
							)}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	happsWithVersions() {
		const allHapps = this.happsStore.allHapps.get();
		if (allHapps.status !== 'completed') return allHapps;

		const happsVersionsAndUnpublishedLinks = joinAsyncMap(
			mapValues(allHapps.value, happ =>
				joinAsync([happ.happReleases.get(), happ.unpublishedLinks.get()]),
			),
		);
		if (happsVersionsAndUnpublishedLinks.status !== 'completed')
			return happsVersionsAndUnpublishedLinks;

		const happsWithVersions = pickBy(
			happsVersionsAndUnpublishedLinks.value,
			([versions, unpublishedLinks]) =>
				versions.size > 0 && unpublishedLinks.length == 0,
		);

		return {
			status: 'completed' as const,
			value: happsWithVersions,
		};
	}

	render() {
		const map = this.happsWithVersions();

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
		happsStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
