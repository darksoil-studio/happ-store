import { HappVersion } from "./types.js";

import { Happ } from "./types.js";

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
  /** Happ */

  async createHapp(happ: Happ): Promise<EntryRecord<Happ>> {
    const record: Record = await this.callZome("create_happ", happ);
    return new EntryRecord(record);
  }

  async getLatestHapp(happHash: ActionHash): Promise<EntryRecord<Happ> | undefined> {
    const record: Record = await this.callZome("get_latest_happ", happHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getOriginalHapp(happHash: ActionHash): Promise<EntryRecord<Happ> | undefined> {
    const record: Record = await this.callZome("get_original_happ", happHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getAllRevisionsForHapp(happHash: ActionHash): Promise<Array<EntryRecord<Happ>>> {
    const records: Record[] = await this.callZome("get_all_revisions_for_happ", happHash);
    return records.map(r => new EntryRecord(r));
  }

  async updateHapp(
    originalHappHash: ActionHash,
    previousHappHash: ActionHash,
    updatedHapp: Happ,
  ): Promise<EntryRecord<Happ>> {
    const record: Record = await this.callZome("update_happ", {
      original_happ_hash: originalHappHash,
      previous_happ_hash: previousHappHash,
      updated_happ: updatedHapp,
    });
    return new EntryRecord(record);
  }

  deleteHapp(originalHappHash: ActionHash): Promise<ActionHash> {
    return this.callZome("delete_happ", originalHappHash);
  }

  getAllDeletesForHapp(originalHappHash: ActionHash): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    return this.callZome("get_all_deletes_for_happ", originalHappHash);
  }

  getOldestDeleteForHapp(originalHappHash: ActionHash): Promise<SignedActionHashed<Delete> | undefined> {
    return this.callZome("get_oldest_delete_for_happ", originalHappHash);
  }
  /** Happ Version */

  async createHappVersion(happVersion: HappVersion): Promise<EntryRecord<HappVersion>> {
    const record: Record = await this.callZome("create_happ_version", happVersion);
    return new EntryRecord(record);
  }

  async getLatestHappVersion(happVersionHash: ActionHash): Promise<EntryRecord<HappVersion> | undefined> {
    const record: Record = await this.callZome("get_latest_happ_version", happVersionHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getOriginalHappVersion(happVersionHash: ActionHash): Promise<EntryRecord<HappVersion> | undefined> {
    const record: Record = await this.callZome("get_original_happ_version", happVersionHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getAllRevisionsForHappVersion(happVersionHash: ActionHash): Promise<Array<EntryRecord<HappVersion>>> {
    const records: Record[] = await this.callZome("get_all_revisions_for_happ_version", happVersionHash);
    return records.map(r => new EntryRecord(r));
  }

  async updateHappVersion(
    originalHappVersionHash: ActionHash,
    previousHappVersionHash: ActionHash,
    updatedHappVersion: HappVersion,
  ): Promise<EntryRecord<HappVersion>> {
    const record: Record = await this.callZome("update_happ_version", {
      original_happ_version_hash: originalHappVersionHash,
      previous_happ_version_hash: previousHappVersionHash,
      updated_happ_version: updatedHappVersion,
    });
    return new EntryRecord(record);
  }

  async getHappVersionsForHapp(happHash: ActionHash): Promise<Array<Link>> {
    return this.callZome("get_happ_versions_for_happ", happHash);
  }

  /** All Happs */

  async getAllHapps(): Promise<Array<Link>> {
    return this.callZome("get_all_happs", undefined);
  }

  /** Publisher Happs */

  async getPublisherHapps(author: AgentPubKey): Promise<Array<Link>> {
    return this.callZome("get_publisher_happs", author);
  }
}
