import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import {
	EntryRecord,
	ZomeClient,
	isSignalFromCellWithRole,
} from '@tnesh-stack/utils';

import { HappRelease } from './types.js';
import { Happ } from './types.js';
import { HappsSignal } from './types.js';

export class HappsClient extends ZomeClient<HappsSignal> {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'happs',
	) {
		super(client, roleName, zomeName);
	}
	/** Happ */

	async createHapp(happ: Happ): Promise<EntryRecord<Happ>> {
		const record: Record = await this.callZome('create_happ', happ);
		return new EntryRecord(record);
	}

	async getLatestHapp(
		happHash: ActionHash,
	): Promise<EntryRecord<Happ> | undefined> {
		const record: Record = await this.callZome('get_latest_happ', happHash);
		return record ? new EntryRecord(record) : undefined;
	}

	async getOriginalHapp(
		happHash: ActionHash,
	): Promise<EntryRecord<Happ> | undefined> {
		const record: Record = await this.callZome('get_original_happ', happHash);
		return record ? new EntryRecord(record) : undefined;
	}

	async getAllRevisionsForHapp(
		happHash: ActionHash,
	): Promise<Array<EntryRecord<Happ>>> {
		const records: Record[] = await this.callZome(
			'get_all_revisions_for_happ',
			happHash,
		);
		return records.map(r => new EntryRecord(r));
	}

	async updateHapp(
		originalHappHash: ActionHash,
		previousHappHash: ActionHash,
		updatedHapp: Happ,
	): Promise<EntryRecord<Happ>> {
		const record: Record = await this.callZome('update_happ', {
			original_happ_hash: originalHappHash,
			previous_happ_hash: previousHappHash,
			updated_happ: updatedHapp,
		});
		return new EntryRecord(record);
	}

	deleteHapp(originalHappHash: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_happ', originalHappHash);
	}

	getAllDeletesForHapp(
		originalHappHash: ActionHash,
	): Promise<Array<SignedActionHashed<Delete>> | undefined> {
		return this.callZome('get_all_deletes_for_happ', originalHappHash);
	}

	getOldestDeleteForHapp(
		originalHappHash: ActionHash,
	): Promise<SignedActionHashed<Delete> | undefined> {
		return this.callZome('get_oldest_delete_for_happ', originalHappHash);
	}

	/** Happ unpublishing */

	async unpublishHapp(happHash: ActionHash): Promise<void> {
		return this.callZome('unpublish_happ', happHash);
	}

	async getHappUnpublishedLinks(happHash: ActionHash): Promise<Array<Link>> {
		return this.callZome('get_happ_unpublished_links', happHash);
	}

	async republishHapp(happHash: ActionHash): Promise<void> {
		return this.callZome('republish_happ', happHash);
	}

	/** hApp Release */

	async createHappRelease(
		happRelease: HappRelease,
	): Promise<EntryRecord<HappRelease>> {
		const record: Record = await this.callZome(
			'create_happ_release',
			happRelease,
		);
		return new EntryRecord(record);
	}

	async getLatestHappRelease(
		happReleaseHash: ActionHash,
	): Promise<EntryRecord<HappRelease> | undefined> {
		const record: Record = await this.callZome(
			'get_latest_happ_release',
			happReleaseHash,
		);
		return record ? new EntryRecord(record) : undefined;
	}

	async getOriginalHappRelease(
		happReleaseHash: ActionHash,
	): Promise<EntryRecord<HappRelease> | undefined> {
		const record: Record = await this.callZome(
			'get_original_happ_release',
			happReleaseHash,
		);
		return record ? new EntryRecord(record) : undefined;
	}

	async getAllRevisionsForHappRelease(
		happReleaseHash: ActionHash,
	): Promise<Array<EntryRecord<HappRelease>>> {
		const records: Record[] = await this.callZome(
			'get_all_revisions_for_happ_release',
			happReleaseHash,
		);
		return records.map(r => new EntryRecord(r));
	}

	async updateHappRelease(
		originalHappReleaseHash: ActionHash,
		previousHappReleaseHash: ActionHash,
		updatedHappRelease: HappRelease,
	): Promise<EntryRecord<HappRelease>> {
		const record: Record = await this.callZome('update_happ_release', {
			original_happ_release_hash: originalHappReleaseHash,
			previous_happ_release_hash: previousHappReleaseHash,
			updated_happ_release: updatedHappRelease,
		});
		return new EntryRecord(record);
	}

	async getHappReleasesForHapp(happHash: ActionHash): Promise<Array<Link>> {
		return this.callZome('get_happ_releases_for_happ', happHash);
	}

	/** All Happs */

	async getAllHapps(): Promise<Array<Link>> {
		return this.callZome('get_all_happs', undefined);
	}

	/** Publisher Happs */

	async getPublisherHapps(author: AgentPubKey): Promise<Array<Link>> {
		return this.callZome('get_publisher_happs', author);
	}
}
