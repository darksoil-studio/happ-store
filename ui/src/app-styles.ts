import { sharedStyles } from '@tnesh-stack/elements';
import { css } from 'lit';

export const appStyles = [
	css`
		.top-bar {
			align-items: center;
			background-color: var(--sl-color-primary-500);
			padding: 16px;
			height: 40px;
		}
	`,
	...sharedStyles,
];
