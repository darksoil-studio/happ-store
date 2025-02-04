import {
	ActionHash,
	AgentPubKey,
	EntryHash,
	NewEntryAction,
	Record,
} from '@holochain/client';
import {
	AsyncComputed,
	allRevisionsOfEntrySignal,
	collectionSignal,
	deletedLinksSignal,
	deletesForEntrySignal,
	immutableEntrySignal,
	latestVersionOfEntrySignal,
	liveLinksSignal,
	pipe,
} from '@tnesh-stack/signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	retype,
	slice,
} from '@tnesh-stack/utils';

import { HappsClient } from './happs-client.js';
import { HappVersion } from './types.js';
import { Happ } from './types.js';

export class HappsStore {
	constructor(public client: HappsClient) {}
	/** Happ */

	happs = new MemoHoloHashMap((happHash: ActionHash) => ({
		latestVersion: latestVersionOfEntrySignal(this.client, () =>
			this.client.getLatestHapp(happHash),
		),
		original: immutableEntrySignal(() => this.client.getOriginalHapp(happHash)),
		allRevisions: allRevisionsOfEntrySignal(this.client, () =>
			this.client.getAllRevisionsForHapp(happHash),
		),
		deletes: deletesForEntrySignal(this.client, happHash, () =>
			this.client.getAllDeletesForHapp(happHash),
		),
		happVersions: pipe(
			liveLinksSignal(
				this.client,
				happHash,
				() => this.client.getHappVersionsForHapp(happHash),
				'HappToHappVersions',
			),
			links =>
				slice(
					this.happVersions,
					links.map(l => l.target),
				),
		),
	}));

	/** Happ Version */

	happVersions = new MemoHoloHashMap((happVersionHash: ActionHash) => ({
		latestVersion: latestVersionOfEntrySignal(this.client, () =>
			this.client.getLatestHappVersion(happVersionHash),
		),
		original: immutableEntrySignal(() =>
			this.client.getOriginalHappVersion(happVersionHash),
		),
		allRevisions: allRevisionsOfEntrySignal(this.client, () =>
			this.client.getAllRevisionsForHappVersion(happVersionHash),
		),
	}));

	/** All Happs */

	allHapps = pipe(
		collectionSignal(this.client, () => this.client.getAllHapps(), 'AllHapps'),
		allHapps =>
			slice(
				this.happs,
				allHapps.map(l => l.target),
			),
	);

	/** Publisher Happs */

	publisherHapps = new MemoHoloHashMap((author: AgentPubKey) =>
		pipe(
			collectionSignal(
				this.client,
				() => this.client.getPublisherHapps(author),
				'PublisherHapps',
			),
			publisherHapps =>
				slice(
					this.happs,
					publisherHapps.map(l => l.target),
				),
		),
	);
}
