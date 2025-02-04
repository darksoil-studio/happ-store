import {
  ActionHash,
  AgentPubKey,
  AppBundleSource,
  AppCallZomeRequest,
  AppWebsocket,
  encodeHashToBase64,
  EntryHash,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  NewEntryAction,
  Record,
} from "@holochain/client";
import { Scenario } from "@holochain/tryorama";
import { encode } from "@msgpack/msgpack";
import { EntryRecord } from "@tnesh-stack/utils";
import { HappsClient } from "../../../../ui/src/main/happs/happs-client.js";
import { HappsStore } from "../../../../ui/src/main/happs/happs-store.js";
import { appPath } from "../../app-path.js";

export async function setup(scenario: Scenario, numPlayers = 2) {
  const players = await scenario.addPlayersWithApps(
    new Array(numPlayers).fill({ appBundleSource: { path: appPath } }),
  );
  const playersAndStores = await Promise.all(players.map(setupStore));

  // Shortcut peer discovery through gossip and register all agents in every
  // conductor of the scenario.
  await scenario.shareAllAgents();

  return playersAndStores;
}

async function setupStore(player: Player) {
  patchCallZome(player.appWs as AppWebsocket);
  await player.conductor
    .adminWs()
    .authorizeSigningCredentials(player.cells[0].cell_id);
  const store = new HappsStore(
    new HappsClient(player.appWs as any, "main"),
  );
  return {
    store,
    player,
    startUp: async () => {
      await player.conductor.startUp();
      const port = await player.conductor.attachAppInterface();
      const issued = await player.conductor
        .adminWs()
        .issueAppAuthenticationToken({
          installed_app_id: player.appId,
        });
      const appWs = await player.conductor.connectAppWs(issued.token, port);
      patchCallZome(appWs);
      store.client.client = appWs;
    },
  };
}

function patchCallZome(appWs: AppWebsocket) {
  const callZome = appWs.callZome;
  appWs.callZome = async req => {
    try {
      const result = await callZome(req);
      return result;
    } catch (e) {
      if (
        !e.toString().includes("Socket is not open")
        && !e.toString().includes("ClientClosedWithPendingRequests")
      ) {
        throw e;
      }
    }
  };
}

export async function waitUntil(
  condition: () => Promise<boolean>,
  timeout: number,
) {
  const start = Date.now();
  const isDone = await condition();
  if (isDone) return;
  if (timeout <= 0) throw new Error("timeout");
  await pause(1000);
  return waitUntil(condition, timeout - (Date.now() - start));
}
