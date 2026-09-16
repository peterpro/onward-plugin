import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function fail(message) {
  throw new Error(message);
}

const manifestPath = readArgument("--manifest");
const sourceSha = readArgument("--source-sha");
const stageTag = readArgument("--stage-tag");
const packageName = readArgument("--package-name");
const packageVersion = readArgument("--package-version");
const archivePath = readArgument("--archive");

if (!manifestPath || !sourceSha || !stageTag || !packageName || !packageVersion || !archivePath) {
  fail("Manifest, source SHA, Stage tag, package name, package version, and archive are required.");
}
if (!/^[0-9a-f]{40}$/.test(sourceSha)) {
  fail("Promotion source SHA must be a 40-character commit SHA.");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.sourceSha !== sourceSha) {
  fail("Promotion manifest source SHA does not match the requested source SHA.");
}
if (manifest.releaseTag !== stageTag) {
  fail("Promotion manifest release tag does not match the selected Stage tag.");
}

const packageEntry = manifest.packages?.find((item) => item.name === packageName);
if (!packageEntry) {
  fail("Promotion manifest does not contain " + packageName + ".");
}
if (packageEntry.version !== packageVersion) {
  fail("Promotion manifest package version does not match " + packageVersion + ".");
}
if (!packageEntry.archive?.sha256) {
  fail("Promotion manifest does not contain an archive checksum for " + packageName + ".");
}

const archiveSha = createHash("sha256")
  .update(await readFile(archivePath))
  .digest("hex");
if (archiveSha !== packageEntry.archive.sha256) {
  fail("Downloaded promotion archive does not match the Stage manifest checksum.");
}

process.stdout.write(
  "Validated " + packageName + " promotion source " + sourceSha + ".\n"
);
