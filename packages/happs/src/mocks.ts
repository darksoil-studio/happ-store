import {
	ActionHash,
	AgentPubKey,
	AppClient,
	Delete,
	EntryHash,
	Link,
	NewEntryAction,
	Record,
	SignedActionHashed,
	decodeHashFromBase64,
	fakeActionHash,
	fakeAgentPubKey,
	fakeDnaHash,
	fakeEntryHash,
} from '@holochain/client';
import {
	AgentPubKeyMap,
	HashType,
	HoloHashMap,
	RecordBag,
	ZomeMock,
	decodeEntry,
	entryState,
	fakeCreateAction,
	fakeDeleteEntry,
	fakeEntry,
	fakeRecord,
	fakeUpdateEntry,
	hash,
	pickBy,
} from '@darksoil-studio/holochain-utils';

import { HappsClient } from './happs-client.js';
import { HappRelease } from './types.js';
import { Happ } from './types.js';

export class HappsZomeMock extends ZomeMock implements AppClient {
	constructor(myPubKey?: AgentPubKey) {
		super('happs_test', 'happs', 'test-app', myPubKey);
	}
	/** Happ */
	happs = new HoloHashMap<
		ActionHash,
		{
			deletes: Array<SignedActionHashed<Delete>>;
			revisions: Array<Record>;
		}
	>();

	async create_happ(happ: Happ): Promise<Record> {
		const entryHash = hash(happ, HashType.ENTRY);
		const record = await fakeRecord(
			await fakeCreateAction(entryHash),
			fakeEntry(happ),
		);

		this.happs.set(record.signed_action.hashed.hash, {
			deletes: [],
			revisions: [record],
		});

		return record;
	}

	async get_latest_happ(happHash: ActionHash): Promise<Record | undefined> {
		const happ = this.happs.get(happHash);
		return happ ? happ.revisions[happ.revisions.length - 1] : undefined;
	}

	async get_all_revisions_for_happ(
		happHash: ActionHash,
	): Promise<Record[] | undefined> {
		const happ = this.happs.get(happHash);
		return happ ? happ.revisions : undefined;
	}

	async get_original_happ(happHash: ActionHash): Promise<Record | undefined> {
		const happ = this.happs.get(happHash);
		return happ ? happ.revisions[0] : undefined;
	}

	async get_all_deletes_for_happ(
		happHash: ActionHash,
	): Promise<Array<SignedActionHashed<Delete>> | undefined> {
		const happ = this.happs.get(happHash);
		return happ ? happ.deletes : undefined;
	}

	async get_oldest_delete_for_happ(
		happHash: ActionHash,
	): Promise<SignedActionHashed<Delete> | undefined> {
		const happ = this.happs.get(happHash);
		return happ ? happ.deletes[0] : undefined;
	}
	async delete_happ(original_happ_hash: ActionHash): Promise<ActionHash> {
		const record = await fakeRecord(await fakeDeleteEntry(original_happ_hash));

		this.happs
			.get(original_happ_hash)
			.deletes.push(record.signed_action as SignedActionHashed<Delete>);

		return record.signed_action.hashed.hash;
	}

	async update_happ(input: {
		original_happ_hash: ActionHash;
		previous_happ_hash: ActionHash;
		updated_happ: Happ;
	}): Promise<Record> {
		const record = await fakeRecord(
			await fakeUpdateEntry(
				input.previous_happ_hash,
				undefined,
				undefined,
				fakeEntry(input.updated_happ),
			),
			fakeEntry(input.updated_happ),
		);

		this.happs.get(input.original_happ_hash).revisions.push(record);

		const happ = input.updated_happ;

		return record;
	}
	/** hApp Release */
	happReleases = new HoloHashMap<
		ActionHash,
		{
			deletes: Array<SignedActionHashed<Delete>>;
			revisions: Array<Record>;
		}
	>();
	happReleasesForHapp = new HoloHashMap<ActionHash, Link[]>();

	async create_happ_release(happRelease: HappRelease): Promise<Record> {
		const entryHash = hash(happRelease, HashType.ENTRY);
		const record = await fakeRecord(
			await fakeCreateAction(entryHash),
			fakeEntry(happRelease),
		);

		this.happReleases.set(record.signed_action.hashed.hash, {
			deletes: [],
			revisions: [record],
		});

		const existingHappHash =
			this.happReleasesForHapp.get(happRelease.happ_hash) || [];
		this.happReleasesForHapp.set(happRelease.happ_hash, [
			...existingHappHash,
			{
				base: happRelease.happ_hash,
				target: record.signed_action.hashed.hash,
				author: this.myPubKey,
				timestamp: Date.now() * 1000,
				zome_index: 0,
				link_type: 0,
				tag: new Uint8Array(),
				create_link_hash: await fakeActionHash(),
			},
		]);

		return record;
	}

	async get_latest_happ_release(
		happReleaseHash: ActionHash,
	): Promise<Record | undefined> {
		const happRelease = this.happReleases.get(happReleaseHash);
		return happRelease
			? happRelease.revisions[happRelease.revisions.length - 1]
			: undefined;
	}

	async get_all_revisions_for_happ_release(
		happReleaseHash: ActionHash,
	): Promise<Record[] | undefined> {
		const happRelease = this.happReleases.get(happReleaseHash);
		return happRelease ? happRelease.revisions : undefined;
	}

	async get_original_happ_release(
		happReleaseHash: ActionHash,
	): Promise<Record | undefined> {
		const happRelease = this.happReleases.get(happReleaseHash);
		return happRelease ? happRelease.revisions[0] : undefined;
	}

	async update_happ_release(input: {
		original_happ_release_hash: ActionHash;
		previous_happ_release_hash: ActionHash;
		updated_happ_release: HappRelease;
	}): Promise<Record> {
		const record = await fakeRecord(
			await fakeUpdateEntry(
				input.previous_happ_release_hash,
				undefined,
				undefined,
				fakeEntry(input.updated_happ_release),
			),
			fakeEntry(input.updated_happ_release),
		);

		this.happReleases
			.get(input.original_happ_release_hash)
			.revisions.push(record);

		const happRelease = input.updated_happ_release;

		const existingHappHash =
			this.happReleasesForHapp.get(happRelease.happ_hash) || [];
		this.happReleasesForHapp.set(happRelease.happ_hash, [
			...existingHappHash,
			{
				base: happRelease.happ_hash,
				target: record.signed_action.hashed.hash,
				author: record.signed_action.hashed.content.author,
				timestamp: record.signed_action.hashed.content.timestamp,
				zome_index: 0,
				link_type: 0,
				tag: new Uint8Array(),
				create_link_hash: await fakeActionHash(),
			},
		]);

		return record;
	}

	async get_happ_releases_for_happ(happHash: ActionHash): Promise<Array<Link>> {
		return this.happReleasesForHapp.get(happHash) || [];
	}

	async get_all_happs(): Promise<Array<Link>> {
		const records: Record[] = Array.from(this.happs.values()).map(
			r => r.revisions[r.revisions.length - 1],
		);
		const base = await fakeEntryHash();
		return Promise.all(
			records.map(async record => ({
				base,
				target: record.signed_action.hashed.hash,
				author: record.signed_action.hashed.content.author,
				timestamp: record.signed_action.hashed.content.timestamp,
				zome_index: 0,
				link_type: 0,
				tag: new Uint8Array(),
				create_link_hash: await fakeActionHash(),
			})),
		);
	}

	async get_publisher_happs(author: AgentPubKey): Promise<Array<Link>> {
		const records: Record[] = Array.from(this.happs.values())
			.map(r => r.revisions[r.revisions.length - 1])
			.filter(
				r =>
					r.signed_action.hashed.content.author.toString() ===
					author.toString(),
			);
		return Promise.all(
			records.map(async record => ({
				base: author,
				target: record.signed_action.hashed.hash,
				author: record.signed_action.hashed.content.author,
				timestamp: record.signed_action.hashed.content.timestamp,
				zome_index: 0,
				link_type: 0,
				tag: new Uint8Array(),
				create_link_hash: await fakeActionHash(),
			})),
		);
	}
}

export async function sampleHapp(
	client: HappsClient,
	partialHapp: Partial<Happ> = {},
): Promise<Happ> {
	return {
		...{
			name: 'Lorem ipsum 2',
			description: 'Lorem ipsum 2',
			icon: await fakeEntryHash(),
		},
		...partialHapp,
	};
}

export async function sampleHappRelease(
	client: HappsClient,
	partialHappRelease: Partial<HappRelease> = {},
): Promise<HappRelease> {
	return {
		...{
			happ_hash:
				partialHappRelease.happ_hash ||
				(await client.createHapp(await sampleHapp(client))).actionHash,
			version: 'Lorem ipsum 2',
			changes: 'Lorem ipsum 2',
			web_happ_bundle_hash: await fakeEntryHash(),
		},
		...partialHappRelease,
	};
}
