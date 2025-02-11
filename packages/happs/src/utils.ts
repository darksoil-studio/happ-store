import { FileStorageClient } from '@darksoil-studio/file-storage-zome';
import { EntryHash } from '@holochain/client';

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
