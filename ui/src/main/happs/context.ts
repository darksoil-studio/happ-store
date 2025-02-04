import { createContext } from "@lit/context";
import { HappsStore } from "./happs-store.js";

export const happsStoreContext = createContext<HappsStore>(
  "happs/store",
);
