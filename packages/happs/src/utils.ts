import { FileStorageClient } from '@darksoil-studio/file-storage-zome';
import { EntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { AsyncSignal, AsyncState, Signal } from '@tnesh-stack/signals';
import { gunzipSync } from 'fflate';

import { listApps } from './commands';

export async function triggerFileDownload(
	fileHash: EntryHash,
	client: FileStorageClient,
) {
	const file = await client.downloadFile(fileHash);

	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(file);
	const fileName = file.name;
	link.download = fileName;
	link.click();
}

export async function decodeBundle<T>(file: File): Promise<T> {
	const bytes = await file.bytes();
	const expanded = gunzipSync(bytes);
	return decode(expanded) as T;
}

export function fromPromiseWithReload<T>(task: () => Promise<T>): {
	signal: AsyncSignal<T>;
	reload: () => void;
} {
	const signal = new AsyncState<T>(
		{ status: 'pending' },
		{
			[Signal.subtle.watched]: () => {
				task()
					.then(value => {
						signal.set({
							status: 'completed',
							value,
						});
					})
					.catch(error => {
						signal.set({
							status: 'error',
							error,
						});
					});
			},
			[Signal.subtle.unwatched]: () => {},
		},
	);
	return {
		signal,
		reload: () => {
			task()
				.then(value => {
					signal.set({
						status: 'completed',
						value,
					});
				})
				.catch(error => {
					signal.set({
						status: 'error',
						error,
					});
				});
		},
	};
}

export const installedApps = fromPromiseWithReload(() => listApps());
