import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackage } from "./shared/package-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readEnvironment(fileName) {
  return JSON.parse(await readFile(path.join(root, "config", "environments", fileName), "utf8"));
}

export const environments = [
  await readEnvironment("stage.json"),
  await readEnvironment("prod.json")
];

export { buildPackage };
