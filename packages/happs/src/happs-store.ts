import {
	allRevisionsOfEntrySignal,
	collectionSignal,
	deletesForEntrySignal,
	immutableEntrySignal,
	latestVersionOfEntrySignal,
	liveLinksSignal,
	pipe,
} from '@darksoil-studio/holochain-signals';
import { MemoHoloHashMap, slice } from '@darksoil-studio/holochain-utils';
import { ActionHash, AgentPubKey } from '@holochain/client';

import { HappsClient } from './happs-client.js';

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
		happReleases: pipe(
			liveLinksSignal(
				this.client,
				happHash,
				() => this.client.getHappReleasesForHapp(happHash),
				'HappToHappReleases',
				3000,
			),
			links =>
				slice(
					this.happReleases,
					links.map(l => l.target),
				),
		),
		unpublishedLinks: liveLinksSignal(
			this.client,
			happHash,
			() => this.client.getHappUnpublishedLinks(happHash),
			'HappUnpublished',
		),
	}));

	/** hApp Release */

	happReleases = new MemoHoloHashMap((happReleaseHash: ActionHash) => ({
		latestVersion: latestVersionOfEntrySignal(this.client, () =>
			this.client.getLatestHappRelease(happReleaseHash),
		),
		original: immutableEntrySignal(() =>
			this.client.getOriginalHappRelease(happReleaseHash),
		),
		allRevisions: allRevisionsOfEntrySignal(this.client, () =>
			this.client.getAllRevisionsForHappRelease(happReleaseHash),
		),
	}));

	/** All Happs */

	allHapps = pipe(
		collectionSignal(
			this.client,
			() => this.client.getAllHapps(),
			'AllHapps',
			3000,
		),
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
