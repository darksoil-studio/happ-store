import {
	ActionHash,
	AgentPubKey,
	Create,
	CreateLink,
	Delete,
	DeleteLink,
	DnaHash,
	EntryHash,
	Record,
	SignedActionHashed,
	Update,
} from '@holochain/client';
import { ActionCommittedSignal } from '@tnesh-stack/utils';

export type HappsSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes =
	| ({ type: 'HappRelease' } & HappRelease)
	| ({ type: 'Happ' } & Happ);

export type LinkTypes = string;

export interface Happ {
	name: string;

	description: string;

	icon: EntryHash;
}

export interface HappRelease {
	happ_hash: ActionHash;

	version: string;

	changes: string;

	web_happ_bundle_hash: EntryHash;
}
