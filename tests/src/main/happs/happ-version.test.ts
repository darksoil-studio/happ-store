import { HappRelease } from '@darksoil-studio/happs-zome';
import { sampleHappRelease } from '@darksoil-studio/happs-zome/dist/mocks.js';
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

test('create HappRelease', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		// Alice creates a HappRelease
		const happRelease: EntryRecord<HappRelease> =
			await alice.store.client.createHappRelease(
				await sampleHappRelease(alice.store.client),
			);
		assert.ok(happRelease);
	});
});

test('create and read HappRelease', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		const sample = await sampleHappRelease(alice.store.client);

		// Alice creates a HappRelease
		const happRelease: EntryRecord<HappRelease> =
			await alice.store.client.createHappRelease(sample);
		assert.ok(happRelease);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the created HappRelease
		const createReadOutput: EntryRecord<HappRelease> = await toPromise(
			bob.store.happReleases.get(happRelease.actionHash).original,
		);
		assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
	});
});

test('create and update HappRelease', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		// Alice creates a HappRelease
		const happRelease: EntryRecord<HappRelease> =
			await alice.store.client.createHappRelease(
				await sampleHappRelease(alice.store.client),
			);
		assert.ok(happRelease);

		const originalActionHash = happRelease.actionHash;

		// Alice updates the HappRelease
		let contentUpdate = await sampleHappRelease(alice.store.client);

		let updatedHappRelease: EntryRecord<HappRelease> =
			await alice.store.client.updateHappRelease(
				originalActionHash,
				originalActionHash,
				contentUpdate,
			);
		assert.ok(updatedHappRelease);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the updated HappRelease
		const readUpdatedOutput0: EntryRecord<HappRelease> = await toPromise(
			bob.store.happReleases.get(happRelease.actionHash).latestVersion,
		);
		assert.deepEqual(
			contentUpdate,
			cleanNodeDecoding(readUpdatedOutput0.entry),
		);

		// Alice updates the HappRelease again
		contentUpdate = await sampleHappRelease(alice.store.client);

		updatedHappRelease = await alice.store.client.updateHappRelease(
			originalActionHash,
			updatedHappRelease.actionHash,
			contentUpdate,
		);
		assert.ok(updatedHappRelease);

		// Wait for the created entry to be propagated to the other node.
		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets the updated HappRelease
		const readUpdatedOutput1: EntryRecord<HappRelease> = await toPromise(
			bob.store.happReleases.get(originalActionHash).latestVersion,
		);
		assert.deepEqual(
			contentUpdate,
			cleanNodeDecoding(readUpdatedOutput1.entry),
		);
	});
});
