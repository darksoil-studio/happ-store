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
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { rootRouterContext } from './context.js';
import { happsStoreContext } from './main/happs/context.js';
import './main/happs/elements/create-happ.js';
import './main/happs/elements/happ-detail.js';
import './main/happs/elements/publisher-happs.js';
import { HappsStore } from './main/happs/happs-store.js';
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
					<span class="title" style="flex: 1"
						>${msg('Publisher Dashboard')}</span
					>

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

				<div class="flex-scrollable-parent">
					<div class="flex-scrollable-container">
						<div class="flex-scrollable-y">
							<publisher-happs
								style="margin: 16px"
								.author=${this.client.myPubKey}
							></publisher-happs>
						</div>
					</div>
				</div>
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
