import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Directory that contains package.json, whether the code is running from src or dist. */
export const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
