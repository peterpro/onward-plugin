#!/usr/bin/env node

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackage, environments } from "../src/package-definitions.mjs";
import {
  buildClaudeMarketplace,
  buildCodexMarketplace
} from "../src/marketplace-definitions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginsRoot = path.join(root, "plugins");

function fail(message) {
  throw new Error(message);
}

function assertNode22() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22 || major >= 23) {
    fail(`Node.js 22 is required, found ${process.versions.node}`);
  }
}

function assertOutputPath(target) {
  const relative = path.relative(pluginsRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    fail("Refusing to write outside the plugin directory: " + target);
  }
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function buildEnvironment(environment) {
  const outputRoot = path.join(pluginsRoot, environment.name);
  assertOutputPath(outputRoot);
  await rm(outputRoot, { recursive: true, force: true });

  for (const [relativePath, value] of Object.entries(buildPackage(environment))) {
    await writeJson(path.join(outputRoot, relativePath), value);
  }
}

async function main() {
  assertNode22();
  await mkdir(pluginsRoot, { recursive: true });
  for (const environment of environments) {
    await buildEnvironment(environment);
  }
  await writeJson(
    path.join(root, ".agents", "plugins", "marketplace.json"),
    buildCodexMarketplace()
  );
  await writeJson(
    path.join(root, ".claude-plugin", "marketplace.json"),
    buildClaudeMarketplace()
  );

  process.stdout.write(
    `Built ${environments.map((environment) => `${environment.name} ${environment.version}`).join(" and ")}.\n`
  );
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown error."}\n`);
  process.exitCode = 1;
}
