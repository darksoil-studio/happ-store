import { HappVersion } from "./types.js";

import { Happ } from "./types.js";

import {
  ActionHash,
  AgentPubKey,
  AppClient,
  decodeHashFromBase64,
  Delete,
  EntryHash,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import {
  AgentPubKeyMap,
  decodeEntry,
  entryState,
  fakeCreateAction,
  fakeDeleteEntry,
  fakeEntry,
  fakeRecord,
  fakeUpdateEntry,
  hash,
  HashType,
  HoloHashMap,
  pickBy,
  RecordBag,
  ZomeMock,
} from "@tnesh-stack/utils";
import { HappsClient } from "./happs-client.js";

export class HappsZomeMock extends ZomeMock implements AppClient {
  constructor(
    myPubKey?: AgentPubKey,
  ) {
    super("happs_test", "happs", myPubKey);
  }
  /** Happ */
  happs = new HoloHashMap<ActionHash, {
    deletes: Array<SignedActionHashed<Delete>>;
    revisions: Array<Record>;
  }>();

  async create_happ(happ: Happ): Promise<Record> {
    const entryHash = hash(happ, HashType.ENTRY);
    const record = await fakeRecord(await fakeCreateAction(entryHash), fakeEntry(happ));

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

  async get_all_revisions_for_happ(happHash: ActionHash): Promise<Record[] | undefined> {
    const happ = this.happs.get(happHash);
    return happ ? happ.revisions : undefined;
  }

  async get_original_happ(happHash: ActionHash): Promise<Record | undefined> {
    const happ = this.happs.get(happHash);
    return happ ? happ.revisions[0] : undefined;
  }

  async get_all_deletes_for_happ(happHash: ActionHash): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    const happ = this.happs.get(happHash);
    return happ ? happ.deletes : undefined;
  }

  async get_oldest_delete_for_happ(happHash: ActionHash): Promise<SignedActionHashed<Delete> | undefined> {
    const happ = this.happs.get(happHash);
    return happ ? happ.deletes[0] : undefined;
  }
  async delete_happ(original_happ_hash: ActionHash): Promise<ActionHash> {
    const record = await fakeRecord(await fakeDeleteEntry(original_happ_hash));

    this.happs.get(original_happ_hash).deletes.push(record.signed_action as SignedActionHashed<Delete>);

    return record.signed_action.hashed.hash;
  }

  async update_happ(
    input: { original_happ_hash: ActionHash; previous_happ_hash: ActionHash; updated_happ: Happ },
  ): Promise<Record> {
    const record = await fakeRecord(
      await fakeUpdateEntry(input.previous_happ_hash, undefined, undefined, fakeEntry(input.updated_happ)),
      fakeEntry(input.updated_happ),
    );

    this.happs.get(input.original_happ_hash).revisions.push(record);

    const happ = input.updated_happ;

    return record;
  }
  /** Happ Version */
  happVersions = new HoloHashMap<ActionHash, {
    deletes: Array<SignedActionHashed<Delete>>;
    revisions: Array<Record>;
  }>();
  happVersionsForHapp = new HoloHashMap<ActionHash, Link[]>();

  async create_happ_version(happVersion: HappVersion): Promise<Record> {
    const entryHash = hash(happVersion, HashType.ENTRY);
    const record = await fakeRecord(await fakeCreateAction(entryHash), fakeEntry(happVersion));

    this.happVersions.set(record.signed_action.hashed.hash, {
      deletes: [],
      revisions: [record],
    });

    const existingHappHash = this.happVersionsForHapp.get(happVersion.happ_hash) || [];
    this.happVersionsForHapp.set(happVersion.happ_hash, [...existingHappHash, {
      base: happVersion.happ_hash,
      target: record.signed_action.hashed.hash,
      author: this.myPubKey,
      timestamp: Date.now() * 1000,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    }]);

    return record;
  }

  async get_latest_happ_version(happVersionHash: ActionHash): Promise<Record | undefined> {
    const happVersion = this.happVersions.get(happVersionHash);
    return happVersion ? happVersion.revisions[happVersion.revisions.length - 1] : undefined;
  }

  async get_all_revisions_for_happ_version(happVersionHash: ActionHash): Promise<Record[] | undefined> {
    const happVersion = this.happVersions.get(happVersionHash);
    return happVersion ? happVersion.revisions : undefined;
  }

  async get_original_happ_version(happVersionHash: ActionHash): Promise<Record | undefined> {
    const happVersion = this.happVersions.get(happVersionHash);
    return happVersion ? happVersion.revisions[0] : undefined;
  }

  async update_happ_version(
    input: {
      original_happ_version_hash: ActionHash;
      previous_happ_version_hash: ActionHash;
      updated_happ_version: HappVersion;
    },
  ): Promise<Record> {
    const record = await fakeRecord(
      await fakeUpdateEntry(
        input.previous_happ_version_hash,
        undefined,
        undefined,
        fakeEntry(input.updated_happ_version),
      ),
      fakeEntry(input.updated_happ_version),
    );

    this.happVersions.get(input.original_happ_version_hash).revisions.push(record);

    const happVersion = input.updated_happ_version;

    const existingHappHash = this.happVersionsForHapp.get(happVersion.happ_hash) || [];
    this.happVersionsForHapp.set(happVersion.happ_hash, [...existingHappHash, {
      base: happVersion.happ_hash,
      target: record.signed_action.hashed.hash,
      author: record.signed_action.hashed.content.author,
      timestamp: record.signed_action.hashed.content.timestamp,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    }]);

    return record;
  }

  async get_happ_versions_for_happ(happHash: ActionHash): Promise<Array<Link>> {
    return this.happVersionsForHapp.get(happHash) || [];
  }

  async get_all_happs(): Promise<Array<Link>> {
    const records: Record[] = Array.from(this.happs.values()).map(r => r.revisions[r.revisions.length - 1]);
    const base = await fakeEntryHash();
    return Promise.all(records.map(async record => ({
      base,
      target: record.signed_action.hashed.hash,
      author: record.signed_action.hashed.content.author,
      timestamp: record.signed_action.hashed.content.timestamp,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    })));
  }

  async get_publisher_happs(author: AgentPubKey): Promise<Array<Link>> {
    const records: Record[] = Array.from(this.happs.values()).map(r => r.revisions[r.revisions.length - 1]).filter(r =>
      r.signed_action.hashed.content.author.toString() === author.toString()
    );
    return Promise.all(records.map(async record => ({
      base: author,
      target: record.signed_action.hashed.hash,
      author: record.signed_action.hashed.content.author,
      timestamp: record.signed_action.hashed.content.timestamp,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    })));
  }
}

export async function sampleHapp(client: HappsClient, partialHapp: Partial<Happ> = {}): Promise<Happ> {
  return {
    ...{
      name: "Lorem ipsum 2",
      description: "Lorem ipsum 2",
      icon: (await fakeEntryHash()),
    },
    ...partialHapp,
  };
}

export async function sampleHappVersion(
  client: HappsClient,
  partialHappVersion: Partial<HappVersion> = {},
): Promise<HappVersion> {
  return {
    ...{
      happ_hash: partialHappVersion.happ_hash || (await client.createHapp(await sampleHapp(client))).actionHash,
      version: "Lorem ipsum 2",
      changes: "Lorem ipsum 2",
      web_happ_bundle_hash: (await fakeEntryHash()),
    },
    ...partialHappVersion,
  };
}
