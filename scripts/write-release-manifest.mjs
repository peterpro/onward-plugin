import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { environments } from "../src/package-definitions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function sourceSha() {
  const configured = process.env.RELEASE_SOURCE_SHA;
  if (configured) {
    if (!/^[0-9a-f]{40}$/.test(configured)) {
      throw new Error("RELEASE_SOURCE_SHA must be a 40-character commit SHA.");
    }
    return configured;
  }
  try {
    const current = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (!/^[0-9a-f]{40}$/.test(current)) {
      throw new Error("Git HEAD is not a 40-character commit SHA.");
    }
    return current;
  } catch {
    throw new Error("A committed Git source SHA is required for a release manifest.");
  }
}

function releaseTag() {
  const value = readArgument("--release-tag") || process.env.RELEASE_TAG;
  if (!value) {
    throw new Error("A release tag is required for a release manifest.");
  }
  return value;
}

async function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(target, base));
      continue;
    }
    files.push(path.relative(base, target));
  }
  return files.sort();
}

async function treeDigest(directory) {
  const files = await listFiles(directory);
  const entries = [];
  const fileHashes = [];
  for (const relativePath of files) {
    const contents = await readFile(path.join(directory, relativePath));
    const digest = createHash("sha256").update(contents).digest("hex");
    fileHashes.push({ path: relativePath, sha256: digest });
    entries.push(relativePath + "\0" + digest + "\n");
  }
  return {
    sha256: createHash("sha256").update(entries.join("")).digest("hex"),
    files: fileHashes
  };
}

async function fileSha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function archiveMetadata(environment) {
  const fileName = environment.name + "-" + environment.version + ".zip";
  const relativePath = "release-artifacts/" + fileName;
  const absolutePath = path.join(root, relativePath);
  try {
    return {
      path: relativePath,
      sha256: await fileSha256(absolutePath)
    };
  } catch {
    return null;
  }
}

const output = path.resolve(
  root,
  readArgument("--output") || "release-artifacts/release-manifest.json"
);
const packages = [];
for (const environment of environments) {
  const digest = await treeDigest(path.join(root, "plugins", environment.name));
  packages.push({
    name: environment.name,
    version: environment.version,
    directory: "plugins/" + environment.name,
    resourceUrl: environment.resourceUrl,
    supabaseUrl: environment.supabaseUrl,
    treeSha256: digest.sha256,
    files: digest.files,
    archive: await archiveMetadata(environment)
  });
}

const manifest = {
  schemaVersion: 1,
  repository: process.env.GITHUB_REPOSITORY || "peterpro/onward-plugin",
  sourceSha: sourceSha(),
  releaseTag: releaseTag(),
  stageTag: process.env.STAGE_TAG || null,
  acceptanceStatus: process.env.ACCEPTANCE_STATUS || null,
  promotedFromStageTag: process.env.PROMOTED_FROM_STAGE_TAG || null,
  marketplaces: {
    codex: ".agents/plugins/marketplace.json",
    claude: ".claude-plugin/marketplace.json"
  },
  packages
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(manifest, null, 2) + "\n", "utf8");
process.stdout.write("Wrote " + path.relative(root, output) + ".\n");
