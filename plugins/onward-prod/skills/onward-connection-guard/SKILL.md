---
name: onward-connection-guard
description: Safely handle OAuth and MCP connection failures for the Onward plugin.
---

# Onward connection guard

This plugin connects to the Onward MCP resource. Its MCP server alias is `onward`.

When the user asks for Onward data or an Onward action:

1. Use the Onward MCP tools only after the connection is available and authenticated.
2. Treat a startup failure, OAuth failure, HTTP 401 or 403, discovery failure, timeout, incomplete response, or missing tool as `BLOCKED/UNVERIFIED`.
3. Say that the Onward connection is unavailable or unauthenticated, explain the next connection or sign-in step supported by the host, and ask the user to retry.
4. Do not claim that there are no tasks, that a task does not exist, or that an action was completed when the MCP call did not succeed.
5. Do not switch to another environment, connector, account, or guessed data as a fallback.
6. Do not perform mutations after an authentication or connection failure.

Only report an empty result when the corresponding Onward list tool completed successfully and returned an empty result.
