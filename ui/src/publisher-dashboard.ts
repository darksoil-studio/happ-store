import { AppClient } from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { Router, Routes, appClientContext } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { rootRouterContext } from './context.js';

@customElement('publisher-dashboard')
export class PublisherDashboard extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	@consume({ context: rootRouterContext })
	router!: Router;

	renderContent() {
		return html`
			<span>TODO: replace this with the content of your app.</span>
			<span
				>Maybe you want to import elements from one of the TNESH modules?</span
			>
		`;
	}

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('hApp Store')}</span>

					<div class="row" style="gap: 16px">
						<sl-button
							variant="primary"
							@click=${() => this.router.goto('/publisher-dashboard')}
							>${msg('Create App')}
						</sl-button>
					</div>
				</div>

				<div
					class="column"
					style="flex: 1; align-items: center; justify-content: center;"
				>
					${this.renderContent()}
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
