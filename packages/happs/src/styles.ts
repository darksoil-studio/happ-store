import { sharedStyles } from '@tnesh-stack/elements';
import { css } from 'lit';

export const happsStyles = [
	css`
		show-image::part(image) {
			border-radius: 4px;
		}
		sl-card::part(body) {
			display: flex;
			flex: 1;
			height: 100%;
		}
	`,
	...sharedStyles,
];
