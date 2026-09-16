const productUrl = "https://onwards.work";

export function authorizationServerMetadataUrl(supabaseUrl) {
  return `${supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`;
}

function interfaceDefinition(environment) {
  return {
    displayName: environment.displayName,
    shortDescription: "Read and manage your own Onward tasks in an AI workspace.",
    longDescription: "Read and manage your own Onward tasks through a secure MCP connection with OAuth authorization.",
    developerName: "Onward",
    category: "Productivity",
    capabilities: ["Read", "Write"],
    websiteURL: productUrl,
    defaultPrompt: [
      "List my active Onward tasks.",
      "Show my archived Onward tasks for a project.",
      "Block my task and include the blocker reason."
    ],
    brandColor: "#1F6FEB"
  };
}

function portableManifest(environment) {
  return {
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name: environment.name,
    version: environment.version,
    description: "Read and manage your own Onward tasks through a secure MCP connection.",
    author: {
      name: "Onward"
    },
    homepage: productUrl,
    license: "Proprietary",
    keywords: ["productivity", "tasks", "mcp"],
    extensions: {
      "com.openai": {
        interface: interfaceDefinition(environment)
      }
    }
  };
}

function portableMcpManifest(environment) {
  return {
    $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    mcpServers: {
      onward: {
        type: "streamable-http",
        url: environment.resourceUrl
      }
    }
  };
}

function codexCompatibilityManifest(environment) {
  return {
    name: environment.name,
    version: environment.version,
    description: "Read and manage your own Onward tasks through a secure MCP connection.",
    author: {
      name: "Onward"
    },
    mcpServers: "./.mcp.json",
    interface: interfaceDefinition(environment)
  };
}

function claudeCompatibilityManifest(environment) {
  return {
    name: environment.name,
    version: environment.version,
    description: "Read and manage your own Onward tasks through a secure MCP connection.",
    author: {
      name: "Onward"
    },
    license: "Proprietary",
    keywords: ["productivity", "tasks", "mcp"]
  };
}

function claudeMcpManifest(environment) {
  return {
    mcpServers: {
      onward: {
        type: "http",
        url: environment.resourceUrl,
        oauth: {
          authServerMetadataUrl: authorizationServerMetadataUrl(environment.supabaseUrl),
          scopes: "openid"
        }
      }
    }
  };
}

export function buildPackage(environment) {
  return {
    "plugin.json": portableManifest(environment),
    "mcp.json": portableMcpManifest(environment),
    ".codex-plugin/plugin.json": codexCompatibilityManifest(environment),
    ".claude-plugin/plugin.json": claudeCompatibilityManifest(environment),
    ".mcp.json": claudeMcpManifest(environment)
  };
}
