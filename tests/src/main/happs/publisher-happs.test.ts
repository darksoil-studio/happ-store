import { toPromise } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { dhtSync, runScenario } from '@holochain/tryorama';
import { decode } from '@msgpack/msgpack';
import { assert, test } from 'vitest';

import { sampleHapp } from '../../../../packages/happs/src/mocks.js';
import { Happ } from '../../../../packages/happs/src/types.js';
import { setup } from './setup.js';

test('create a Happ and get publisher happs', async () => {
	await runScenario(async scenario => {
		const [alice, bob] = await setup(scenario);

		// Bob gets publisher happs
		let collectionOutput = await toPromise(
			bob.store.publisherHapps.get(alice.player.agentPubKey),
		);
		assert.equal(collectionOutput.size, 0);

		// Alice creates a Happ
		const happ: EntryRecord<Happ> = await alice.store.client.createHapp(
			await sampleHapp(alice.store.client),
		);
		assert.ok(happ);

		await dhtSync([alice.player, bob.player], alice.player.cells[0].cell_id[0]);

		// Bob gets publisher happs again
		collectionOutput = await toPromise(
			bob.store.publisherHapps.get(alice.player.agentPubKey),
		);
		assert.equal(collectionOutput.size, 1);
		assert.deepEqual(happ.actionHash, Array.from(collectionOutput.keys())[0]);
	});
});
