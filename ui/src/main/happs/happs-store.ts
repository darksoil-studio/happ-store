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
}
