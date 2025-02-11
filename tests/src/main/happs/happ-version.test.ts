import { HappVersion } from '@darksoil-studio/happs-zome';
import { sampleHappVersion } from '@darksoil-studio/happs-zome/dist/mocks.js';
import {
	ActionHash,
	Delete,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import { dhtSync, runScenario } from '@holochain/tryorama';
import { decode } from '@msgpack/msgpack';
import { toPromise } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { cleanNodeDecoding } from '@tnesh-stack/utils/dist/clean-node-decoding.js';
import { assert, test } from 'vitest';

import { setup } from './setup.js';

test('create HappVersion', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		// Alice creates a HappVersion
		const happVersion: EntryRecord<HappVersion> =
			await alice.store.client.createHappVersion(
				await sampleHappVersion(alice.store.client),
			);
		assert.ok(happVersion);
	});
});

test('create and read HappVersion', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		const sample = await sampleHappVersion(alice.store.client);

		// Alice creates a HappVersion
		const happVersion: EntryRecord<HappVersion> =
			await alice.store.client.createHappVersion(sample);
		assert.ok(happVersion);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the created HappVersion
		const createReadOutput: EntryRecord<HappVersion> = await toPromise(
			bob.store.happVersions.get(happVersion.actionHash).original,
		);
		assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
	});
});

test('create and update HappVersion', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		// Alice creates a HappVersion
		const happVersion: EntryRecord<HappVersion> =
			await alice.store.client.createHappVersion(
				await sampleHappVersion(alice.store.client),
			);
		assert.ok(happVersion);

		const originalActionHash = happVersion.actionHash;

		// Alice updates the HappVersion
		let contentUpdate = await sampleHappVersion(alice.store.client);

		let updatedHappVersion: EntryRecord<HappVersion> =
			await alice.store.client.updateHappVersion(
				originalActionHash,
				originalActionHash,
				contentUpdate,
			);
		assert.ok(updatedHappVersion);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the updated HappVersion
		const readUpdatedOutput0: EntryRecord<HappVersion> = await toPromise(
			bob.store.happVersions.get(happVersion.actionHash).latestVersion,
		);
		assert.deepEqual(
			contentUpdate,
			cleanNodeDecoding(readUpdatedOutput0.entry),
		);

		// Alice updates the HappVersion again
		contentUpdate = await sampleHappVersion(alice.store.client);

		updatedHappVersion = await alice.store.client.updateHappVersion(
			originalActionHash,
			updatedHappVersion.actionHash,
			contentUpdate,
		);
		assert.ok(updatedHappVersion);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the updated HappVersion
		const readUpdatedOutput1: EntryRecord<HappVersion> = await toPromise(
			bob.store.happVersions.get(originalActionHash).latestVersion,
		);
		assert.deepEqual(
			contentUpdate,
			cleanNodeDecoding(readUpdatedOutput1.entry),
		);
	});
});
