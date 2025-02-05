import '@darksoil-studio/file-storage-zome/dist/elements/file-storage-context.js';
import {
	ActionHash,
	AdminWebsocket,
	AppClient,
	AppWebsocket,
} from '@holochain/client';
import { provide } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiArrowLeft } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { Router, hashState, wrapPathInSvg } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/app-client-context.js';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { adminWebsocketContext, rootRouterContext } from './context.js';
import './home-page.js';
import './main/happs/elements/happs-context.js';
import './publisher-dashboard.js';

@localized()
@customElement('holochain-app')
export class HolochainApp extends SignalWatcher(LitElement) {
	@state()
	_loading = true;
	@state()
	_view = { view: 'main' };
	@state()
	_error: unknown | undefined;

	_client!: AppClient;

	@provide({ context: rootRouterContext })
	router = new Router(this, [
		{
			path: '/',
			enter: () => {
				// Redirect to "/home/"
				this.router.goto('/home/');
				return false;
			},
		},
		{
			path: '/home/*',
			render: () =>
				html`<home-page
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></home-page>`,
		},
		{
			path: '/publisher-dashboard/*',
			render: () =>
				html`<publisher-dashboard
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></publisher-dashboard>`,
		},
		{
			path: '/my-profile',
			render: () => this.renderMyProfilePage(),
		},
	]);

	async firstUpdated() {
		try {
			this._client = await AppWebsocket.connect();
		} catch (e: unknown) {
			this._error = e;
		} finally {
			this._loading = false;
		}
	}

	renderMyProfilePage() {
		return html`
			<div class="column fill">
				<div class="row top-bar">
					<sl-icon-button
						style="color: black"
						.src=${wrapPathInSvg(mdiArrowLeft)}
						@click=${() => this.router.goto('/home/')}
					></sl-icon-button>
					<span class="title" style="flex: 1">${msg('My Profile')}</span>
				</div>

				<sl-card style="width: 600px; margin: 24px; align-self: center">
					<my-profile style="margin: 16px; flex: 1"></my-profile>
				</sl-card>
			</div>
		`;
	}

	render() {
		if (this._loading) {
			return html`<div
				class="row"
				style="flex: 1; height: 100%; align-items: center; justify-content: center;"
			>
				<sl-spinner style="font-size: 2rem"></sl-spinner>
			</div>`;
		}

		if (this._error) {
			return html`
				<div
					style="flex: 1; height: 100%; align-items: center; justify-content: center;"
				>
					<display-error
						.error=${this._error}
						.headline=${msg('Error connecting to holochain')}
					>
					</display-error>
				</div>
			`;
		}

		return html`
			<app-client-context .client=${this._client}>
				<happs-context role="main">
					<file-storage-context role="main" zome="file_storage_gateway">
						${this.router.outlet()}
					</file-storage-context>
				</happs-context>
			</app-client-context>
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
