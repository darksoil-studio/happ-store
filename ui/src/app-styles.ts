import { sharedStyles } from '@tnesh-stack/elements';
import { css } from 'lit';

export const appStyles = [
	css`
		.top-bar {
			align-items: center;
			background-color: var(--sl-color-primary-500);
			padding: 16px;
			border: 1px solid var(--sl-color-gray-300, lightgrey);
			box-shadow: rgba(149, 157, 165, 0.2) 2px 2px 4px;
			height: 40px;
		}
	`,
	...sharedStyles,
];
