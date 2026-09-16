import { lstat, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildPackage, environments } from "../src/package-definitions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginsRoot = path.join(root, "plugins");

async function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(target, base));
      continue;
    }
    const stats = await lstat(target);
    assert.equal(stats.isSymbolicLink(), false, "symlink is not allowed: " + target);
    assert.equal(stats.isFile(), true, "generated entry is not a file: " + target);
    files.push(path.relative(base, target));
  }
  return files.sort();
}

async function treeDigest(directory) {
  const files = await listFiles(directory);
  const entries = [];
  for (const relativePath of files) {
    const digest = createHash("sha256")
      .update(await readFile(path.join(directory, relativePath)))
      .digest("hex");
    entries.push(relativePath + "\0" + digest + "\n");
  }
  return createHash("sha256").update(entries.join("")).digest("hex");
}

async function readPluginJson(environmentName, relativePath) {
  return JSON.parse(
    await readFile(path.join(pluginsRoot, environmentName, relativePath), "utf8")
  );
}

test("generates the expected Stage and Prod package roots", async () => {
  const expectedFiles = [
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "mcp.json",
    "plugin.json"
  ];

  for (const environment of environments) {
    const outputRoot = path.join(pluginsRoot, environment.name);
    assert.deepEqual(await listFiles(outputRoot), expectedFiles);

    const portable = await readPluginJson(environment.name, "plugin.json");
    assert.equal(portable.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
    assert.equal(portable.name, environment.name);
    assert.equal(portable.version, environment.version);
    assert.deepEqual(portable.extensions["com.openai"].interface.capabilities, ["Read", "Write"]);

    const mcp = await readPluginJson(environment.name, "mcp.json");
    assert.equal(mcp.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json");
    assert.equal(mcp.mcpServers.onward.type, "streamable-http");
    assert.equal(mcp.mcpServers.onward.url, environment.resourceUrl);

    const codex = await readPluginJson(environment.name, ".codex-plugin/plugin.json");
    assert.equal(codex.mcpServers, "./.mcp.json");

    const claude = await readPluginJson(environment.name, ".mcp.json");
    assert.equal(claude.mcpServers.onward.type, "http");
    assert.equal(claude.mcpServers.onward.url, environment.resourceUrl);
    assert.equal(claude.mcpServers.onward.oauth.scopes, "openid");
    assert.equal(
      claude.mcpServers.onward.oauth.authServerMetadataUrl,
      environment.supabaseUrl + "/.well-known/oauth-authorization-server/auth/v1"
    );
  }
});

test("keeps the generated packages local, credential-free, and environment-specific", async () => {
  const stageDigest = await treeDigest(path.join(pluginsRoot, "onward-stage"));
  const prodDigest = await treeDigest(path.join(pluginsRoot, "onward-prod"));
  assert.notEqual(stageDigest, prodDigest);

  for (const environment of environments) {
    const files = await listFiles(path.join(pluginsRoot, environment.name));
    for (const relativePath of files) {
      const contents = await readFile(
        path.join(pluginsRoot, environment.name, relativePath),
        "utf8"
      );
      assert.equal(contents.includes("/Users/"), false, "machine path leaked into " + relativePath);
      assert.equal(contents.includes("/home/"), false, "machine path leaked into " + relativePath);
      assert.equal(contents.includes("client_secret"), false, "client secret leaked into " + relativePath);
      assert.equal(contents.includes("client_credentials"), false, "M2M flow leaked into " + relativePath);
    }
  }
});

test("source definitions match generated manifests", async () => {
  for (const environment of environments) {
    const generated = await readPluginJson(environment.name, "plugin.json");
    assert.deepEqual(generated, buildPackage(environment)["plugin.json"]);
  }
});

test("generates host-specific marketplaces with both environment packages", async () => {
  const codexMarketplace = JSON.parse(
    await readFile(path.join(root, ".agents", "plugins", "marketplace.json"), "utf8")
  );
  const claudeMarketplace = JSON.parse(
    await readFile(path.join(root, ".claude-plugin", "marketplace.json"), "utf8")
  );
  const expectedNames = environments.map((environment) => environment.name);
  const expectedPaths = expectedNames.map((name) => "./plugins/" + name);

  assert.equal(codexMarketplace.name, "onward-plugins");
  assert.equal(codexMarketplace.interface.displayName, "Onward Plugins");
  assert.deepEqual(
    codexMarketplace.plugins.map((plugin) => plugin.name),
    expectedNames
  );
  assert.deepEqual(
    codexMarketplace.plugins.map((plugin) => plugin.source.path),
    expectedPaths
  );
  for (const plugin of codexMarketplace.plugins) {
    assert.equal(plugin.policy.installation, "AVAILABLE");
    assert.equal(plugin.policy.authentication, "ON_INSTALL");
    assert.equal(plugin.category, "Productivity");
  }

  assert.equal(claudeMarketplace.name, "onward-plugins");
  assert.equal(claudeMarketplace.owner.name, "Onward");
  assert.deepEqual(
    claudeMarketplace.plugins.map((plugin) => plugin.name),
    expectedNames
  );
  assert.deepEqual(
    claudeMarketplace.plugins.map((plugin) => plugin.source),
    expectedPaths
  );
});
