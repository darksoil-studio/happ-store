import { HappVersion } from "./types.js";

import { Happ } from "./types.js";

import { ActionHash, AgentPubKey, EntryHash, NewEntryAction, Record } from "@holochain/client";
import {
  allRevisionsOfEntrySignal,
  AsyncComputed,
  collectionSignal,
  deletedLinksSignal,
  deletesForEntrySignal,
  immutableEntrySignal,
  latestVersionOfEntrySignal,
  liveLinksSignal,
  pipe,
} from "@tnesh-stack/signals";
import { EntryRecord, HashType, MemoHoloHashMap, retype, slice } from "@tnesh-stack/utils";

import { HappsClient } from "./happs-client.js";

export class HappsStore {
  constructor(public client: HappsClient) {}
  /** Happ */

  happs = new MemoHoloHashMap((happHash: ActionHash) => ({
    latestVersion: latestVersionOfEntrySignal(this.client, () => this.client.getLatestHapp(happHash)),
    original: immutableEntrySignal(() => this.client.getOriginalHapp(happHash)),
    allRevisions: allRevisionsOfEntrySignal(this.client, () => this.client.getAllRevisionsForHapp(happHash)),
    deletes: deletesForEntrySignal(this.client, happHash, () => this.client.getAllDeletesForHapp(happHash)),
    happVersions: pipe(
      liveLinksSignal(
        this.client,
        happHash,
        () => this.client.getHappVersionsForHapp(happHash),
        "HappToHappVersions",
      ),
      links => slice(this.happVersions, links.map(l => l.target)),
    ),
  }));
  /** Happ Version */

  happVersions = new MemoHoloHashMap((happVersionHash: ActionHash) => ({
    latestVersion: latestVersionOfEntrySignal(this.client, () => this.client.getLatestHappVersion(happVersionHash)),
    original: immutableEntrySignal(() => this.client.getOriginalHappVersion(happVersionHash)),
    allRevisions: allRevisionsOfEntrySignal(
      this.client,
      () => this.client.getAllRevisionsForHappVersion(happVersionHash),
    ),
  }));
}
