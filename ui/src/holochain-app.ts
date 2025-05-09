import '@darksoil-studio/file-storage-zome/dist/elements/file-storage-context.js';
import { HappsContext } from '@darksoil-studio/happs-zome/dist/elements/happs-context.js';
import '@darksoil-studio/happs-zome/dist/elements/happs-context.js';
import {
	ActionHash,
	AdminWebsocket,
	AppClient,
	AppWebsocket,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { provide } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiArrowLeft } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { Router, hashState, wrapPathInSvg } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/app-client-context.js';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { isMobileContext, rootRouterContext } from './context.js';
import './home-page.js';
import './publisher-dashboard.js';

export const MOBILE_WIDTH_PX = 600;

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
				this.router.goto('/home');
				return false;
			},
		},
		{
			path: '/home',
			render: () =>
				html`<home-page
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></home-page>`,
		},
		{
			path: '/publisher-dashboard',
			render: () =>
				html`<publisher-dashboard
					@happ-selected=${(e: CustomEvent) =>
						this.router.goto(`/happ/${encodeHashToBase64(e.detail.happHash)}`)}
					@create-happ-selected=${() => this.router.goto('/create-happ')}
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></publisher-dashboard>`,
		},
		{
			path: '/create-happ',
			render: () => html`
				<overlay-page
					.title=${msg('Create hApp')}
					@close-requested=${() => this.router.goto('/publisher-dashboard')}
				>
					<create-happ
						@happ-created=${() => this.router.goto('/publisher-dashboard')}
					>
					</create-happ>
				</overlay-page>
			`,
		},
		{
			path: '/happ/:happHash',
			render: params => {
				const title = this.happStore?.happs
					.get(decodeHashFromBase64(params.happHash!))
					.latestVersion.get();
				return html`
					<overlay-page
						icon="back"
						.title=${title?.status === 'completed'
							? title?.value.entry.name
							: ''}
						@close-requested=${() => this.router.goto('/publisher-dashboard')}
					>
						<happ-detail
							.happHash=${decodeHashFromBase64(params.happHash!)}
							@new-happ-release-selected=${(e: CustomEvent) =>
								this.router.goto(`/happ/${params.happHash}/new-release`)}
							@happ-release-selected=${(e: CustomEvent) =>
								this.router.goto(
									`/happ/${params.happHash}/release/${encodeHashToBase64(e.detail.happReleaseHash)}`,
								)}
						>
						</happ-detail>
					</overlay-page>
				`;
			},
		},
		{
			path: '/happ/:happHash/new-release',
			render: params =>
				html` <overlay-page
					.title=${msg('New Release')}
					@close-requested=${() => this.router.goto(`/happ/${params.happHash}`)}
				>
					<create-happ-release
						.happHash=${decodeHashFromBase64(params.happHash!)}
						@happ-release-created=${(e: CustomEvent) =>
							this.router.goto(
								`/happ/${params.happHash}/release/${encodeHashToBase64(e.detail.happReleaseHash)}`,
							)}
					></create-happ-release>
				</overlay-page>`,
		},
		{
			path: '/happ/:happHash/release/:happReleaseHash',
			render: params =>
				html` <overlay-page
					icon="back"
					.title=${msg('Release')}
					@close-requested=${() => this.router.goto(`/happ/${params.happHash}`)}
				>
					<happ-release-detail
						.happReleaseHash=${decodeHashFromBase64(params.happReleaseHash!)}
					></happ-release-detail>
				</overlay-page>`,
		},
		{
			path: '/my-profile',
			render: () => this.renderMyProfilePage(),
		},
	]);

	@provide({ context: isMobileContext })
	@property()
	_isMobile: boolean = false;

	async firstUpdated() {
		new ResizeController(this, {
			callback: () => {
				this._isMobile = this.getBoundingClientRect().width < MOBILE_WIDTH_PX;
			},
		});
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

	get happStore() {
		const c = this.shadowRoot?.querySelector('happs-context') as HappsContext;
		return c?.store;
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
