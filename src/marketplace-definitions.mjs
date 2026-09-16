import { environments } from "./package-definitions.mjs";

const marketplaceName = "onward-plugins";
const marketplaceDisplayName = "Onward Plugins";

function packageEntries() {
  return environments.map((environment) => ({
    name: environment.name,
    path: "./plugins/" + environment.name,
    version: environment.version,
    description: "Read and manage your own Onward tasks through a secure MCP connection.",
    category: "Productivity"
  }));
}

export function buildCodexMarketplace() {
  return {
    name: marketplaceName,
    interface: {
      displayName: marketplaceDisplayName
    },
    plugins: packageEntries().map((entry) => ({
      name: entry.name,
      source: {
        source: "local",
        path: entry.path
      },
      policy: {
        installation: "AVAILABLE",
        authentication: "ON_INSTALL"
      },
      category: entry.category
    }))
  };
}

export function buildClaudeMarketplace() {
  return {
    name: marketplaceName,
    owner: {
      name: "Onward"
    },
    plugins: packageEntries().map((entry) => ({
      name: entry.name,
      source: entry.path,
      version: entry.version,
      description: entry.description,
      category: entry.category
    }))
  };
}
