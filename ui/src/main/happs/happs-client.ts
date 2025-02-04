import {
  ActionHash,
  AgentPubKey,
  AppClient,
  CreateLink,
  Delete,
  DeleteLink,
  EntryHash,
  Link,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import { EntryRecord, isSignalFromCellWithRole, ZomeClient } from "@tnesh-stack/utils";

import { HappsSignal } from "./types.js";

export class HappsClient extends ZomeClient<HappsSignal> {
  constructor(public client: AppClient, public roleName: string, public zomeName = "happs") {
    super(client, roleName, zomeName);
  }
}
