import { dirname } from "path";
import { fileURLToPath } from "url";

export const appPath = dirname(fileURLToPath(import.meta.url)) + "/../../workdir/happ-store.happ";
