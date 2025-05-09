import '@darksoil-studio/happs-zome/dist/elements/all-happs.js';
import { AppClient } from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { Router, Routes, appClientContext } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@darksoil-studio/holochain-signals';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { rootRouterContext } from './context.js';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	@consume({ context: rootRouterContext })
	router!: Router;

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('hApp Store')}</span>

					<div class="row" style="gap: 16px">
						<sl-button
							variant="primary"
							@click=${() => this.router.goto('/publisher-dashboard')}
							>${msg('Publisher Dashboard')}
						</sl-button>
					</div>
				</div>

				<all-happs style="flex: 1"> </all-happs>
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
