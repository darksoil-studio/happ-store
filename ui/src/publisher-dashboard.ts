import { HappsStore, happsStoreContext } from '@darksoil-studio/happs-zome';
import '@darksoil-studio/happs-zome/dist/elements/create-happ.js';
import '@darksoil-studio/happs-zome/dist/elements/happ-detail.js';
import '@darksoil-studio/happs-zome/dist/elements/publisher-happs.js';
import {
	AppClient,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { mdiArrowLeft, mdiArrowLeftBold, mdiChartBubble } from '@mdi/js';
import {
	Router,
	Routes,
	appClientContext,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@darksoil-studio/holochain-signals';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { rootRouterContext } from './context.js';
import './overlay-page.js';

@customElement('publisher-dashboard')
export class PublisherDashboard extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	@consume({ context: rootRouterContext })
	router!: Router;

	@consume({ context: happsStoreContext, subscribe: true })
	@property()
	happStore!: HappsStore;

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar" style="gap: 8px">
					<sl-icon-button
						@click=${() => this.router.goto('/')}
						.src=${wrapPathInSvg(mdiArrowLeft)}
					></sl-icon-button>
					<span class="title" style="flex: 1">${msg('Your hApps')}</span>

					<div class="row" style="gap: 16px">
						<sl-button
							variant="primary"
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('create-happ-selected', {
										bubbles: true,
										composed: true,
									}),
								)}
							>${msg('Create App')}
						</sl-button>
					</div>
				</div>

				<publisher-happs
					style="flex: 1"
					.author=${this.client.myPubKey}
				></publisher-happs>
			</div>
		`;
	}

	static styles = [
		css`
			:host {
				display: flex;
				flex: 1;
			}
		`,
		...appStyles,
	];
}
