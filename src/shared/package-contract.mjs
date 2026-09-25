const productUrl = "https://onwards.work";

export function authorizationServerMetadataUrl(supabaseUrl) {
  return `${supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`;
}

function interfaceDefinition(environment) {
  return {
    displayName: environment.displayName,
    shortDescription: "Read and manage your own Onward tasks after OAuth connection.",
    longDescription: "Read and manage your own Onward tasks through a secure OAuth-authorized MCP connection. If the connection is unavailable, report that state explicitly and do not infer that tasks are absent.",
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
      [environment.mcpServerName]: {
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
      [environment.mcpServerName]: {
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

function connectionGuardSkill(environment) {
  return `---
name: onward-connection-guard
description: Safely handle OAuth and MCP connection failures for the ${environment.displayName} plugin.
---

# Onward connection guard

This plugin connects to the ${environment.displayName} MCP resource. Its MCP server alias is \`${environment.mcpServerName}\`.

When the user asks for Onward data or an Onward action:

1. Use the Onward MCP tools only after the connection is available and authenticated.
2. Treat a startup failure, OAuth failure, HTTP 401 or 403, discovery failure, timeout, incomplete response, or missing tool as \`BLOCKED/UNVERIFIED\`.
3. Say that the ${environment.displayName} connection is unavailable or unauthenticated, explain the next connection or sign-in step supported by the host, and ask the user to retry.
4. Do not claim that there are no tasks, that a task does not exist, or that an action was completed when the MCP call did not succeed.
5. Do not switch to another environment, connector, account, or guessed data as a fallback.
6. Do not perform mutations after an authentication or connection failure.

Only report an empty result when the corresponding Onward list tool completed successfully and returned an empty result.
`;
}

export function buildPackage(environment) {
  return {
    "plugin.json": portableManifest(environment),
    "mcp.json": portableMcpManifest(environment),
    ".codex-plugin/plugin.json": codexCompatibilityManifest(environment),
    ".claude-plugin/plugin.json": claudeCompatibilityManifest(environment),
    ".mcp.json": claudeMcpManifest(environment),
    "skills/onward-connection-guard/SKILL.md": connectionGuardSkill(environment)
  };
}
