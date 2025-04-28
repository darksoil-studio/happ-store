import { assert, test } from "vitest";

import { ActionHash, Delete, Record, SignedActionHashed } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";
import { toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { cleanNodeDecoding } from "@darksoil-studio/holochain-utils/dist/clean-node-decoding.js";

import { sampleHapp } from "../../../../ui/src/main/happs/mocks.js";
import { Happ } from "../../../../ui/src/main/happs/types.js";
import { setup } from "./setup.js";

test("create Happ", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Happ
    const happ: EntryRecord<Happ> = await alice.store.client.createHapp(await sampleHapp(alice.store.client));
    assert.ok(happ);
  });
});

test("create and read Happ", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    const sample = await sampleHapp(alice.store.client);

    // Alice creates a Happ
    const happ: EntryRecord<Happ> = await alice.store.client.createHapp(sample);
    assert.ok(happ);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the created Happ
    const createReadOutput: EntryRecord<Happ> = await toPromise(bob.store.happs.get(happ.actionHash).original);
    assert.deepEqual(sample, cleanNodeDecoding(createReadOutput.entry));
  });
});

test("create and update Happ", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Happ
    const happ: EntryRecord<Happ> = await alice.store.client.createHapp(await sampleHapp(alice.store.client));
    assert.ok(happ);

    const originalActionHash = happ.actionHash;

    // Alice updates the Happ
    let contentUpdate = await sampleHapp(alice.store.client);

    let updatedHapp: EntryRecord<Happ> = await alice.store.client.updateHapp(
      originalActionHash,
      originalActionHash,
      contentUpdate,
    );
    assert.ok(updatedHapp);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Happ
    const readUpdatedOutput0: EntryRecord<Happ> = await toPromise(bob.store.happs.get(happ.actionHash).latestVersion);
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput0.entry));

    // Alice updates the Happ again
    contentUpdate = await sampleHapp(alice.store.client);

    updatedHapp = await alice.store.client.updateHapp(originalActionHash, updatedHapp.actionHash, contentUpdate);
    assert.ok(updatedHapp);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob gets the updated Happ
    const readUpdatedOutput1: EntryRecord<Happ> = await toPromise(
      bob.store.happs.get(originalActionHash).latestVersion,
    );
    assert.deepEqual(contentUpdate, cleanNodeDecoding(readUpdatedOutput1.entry));
  });
});

test("create and delete Happ", async () => {
  await runScenario(async scenario => {
    const [alice, bob] = await setup(scenario);

    // Alice creates a Happ
    const happ: EntryRecord<Happ> = await alice.store.client.createHapp(await sampleHapp(alice.store.client));
    assert.ok(happ);

    // Alice deletes the Happ
    const deleteActionHash = await alice.store.client.deleteHapp(happ.actionHash);
    assert.ok(deleteActionHash);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync(
      [alice.player, bob.player],
      alice.player.cells[0].cell_id[0],
    );

    // Bob tries to get the deleted Happ
    const deletes: Array<SignedActionHashed<Delete>> = await toPromise(bob.store.happs.get(happ.actionHash).deletes);
    assert.equal(deletes.length, 1);
  });
});
