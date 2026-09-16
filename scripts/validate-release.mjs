import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { environments } from "../src/package-definitions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  throw new Error(message);
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function currentSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8"
    }).trim();
  } catch {
    return null;
  }
}

const channel = readArgument("--channel");
const tag = readArgument("--tag");
const sourceSha = readArgument("--source-sha");
const environmentName = channel === "stage" ? "onward-stage" : channel === "prod" ? "onward-prod" : null;
const environment = environments.find((item) => item.name === environmentName);

if (!environment) {
  fail("Release channel must be stage or prod.");
}
if (!tag) {
  fail("Release tag is required.");
}
if (!sourceSha || !/^[0-9a-f]{40}$/.test(sourceSha)) {
  fail("A 40-character source SHA is required.");
}
if (tag !== "v" + environment.version) {
  fail("Release tag " + tag + " does not match " + environment.name + " version " + environment.version + ".");
}
if (currentSha() !== sourceSha) {
  fail("Checked out source SHA does not match the requested release SHA.");
}

const manifest = JSON.parse(
  await readFile(path.join(root, "plugins", environment.name, "plugin.json"), "utf8")
);
if (manifest.name !== environment.name || manifest.version !== environment.version) {
  fail("Generated package manifest does not match the environment definition.");
}

process.stdout.write("Validated " + environment.name + " release " + tag + ".\n");
