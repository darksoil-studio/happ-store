import {
	AppInfo,
	InstalledAppId,
	ResourceMap,
	RoleSettingsMap,
} from '@holochain/client';
import { invoke } from '@tauri-apps/api/core';

export async function openHapp(appId: InstalledAppId, title: string) {
	return invoke('plugin:holochain|open_app', {
		appId,
		title,
	});
}

export async function listApps(): Promise<Array<AppInfo>> {
	return invoke('plugin:holochain|list_apps', {});
}

export interface WebAppManifest {
	manifest_version: string;
	name: string;
	ui: Location;
	happ: Location;
}

export type WebAppBundle = {
	manifest: WebAppManifest;
	resources: ResourceMap;
};
export async function installWebHapp(
	appId: InstalledAppId,
	webAppBundle: WebAppBundle,
	rolesSettings: RoleSettingsMap | undefined,
	networkSeed: string | undefined,
) {
	return invoke('plugin:holochain|install_web_app', {
		appId,
		webAppBundle: webAppBundle,
		rolesSettings: rolesSettings,
		networkSeed: networkSeed,
	});
}

export async function uninstallWebHapp(appId: InstalledAppId) {
	return invoke('plugin:holochain|uninstall_web_app', {
		appId,
	});
}
