# Onward plugin acceptance packet

Updated: 2026-09-16

## Static package evidence

| Check | Stage | Prod | Evidence |
| --- | --- | --- | --- |
| Shared source definitions | PASS | PASS | `src/shared/package-contract.mjs` and `config/environments/` |
| Portable manifest | PASS | PASS | `plugins/<environment>/plugin.json` |
| Streamable HTTP MCP config | PASS | PASS | `plugins/<environment>/mcp.json` |
| Claude compatibility | PASS | PASS | `plugins/<environment>/.claude-plugin/` and `.mcp.json` |
| Codex compatibility fallback | PASS | PASS | `plugins/<environment>/.codex-plugin/plugin.json` |
| No machine paths or credentials | PASS | PASS | `tests/structure.test.mjs` |
| Repeated build is deterministic | PASS | PASS | `pnpm check` |
| Codex marketplace catalog | PASS | PASS | `.agents/plugins/marketplace.json` |
| Claude Code marketplace catalog | PASS | PASS | `.claude-plugin/marketplace.json` |

The Stage artifact is `onward-stage` version `0.1.2-stage.1`. The Prod artifact
is `onward-prod` version `0.1.2`. Their resource URLs, Supabase metadata URLs
and package identities are separate. Both hosted Supabase projects have OAuth
Server, `/oauth/consent`, and dynamic client registration enabled.

Release-specific source and archive hashes are recorded in the generated
`release-manifest.json` attached to each GitHub release. Each artifact contains
`plugin.json`, `mcp.json`, `.codex-plugin/plugin.json`,
`.claude-plugin/plugin.json`, and `.mcp.json`.

## Hosted acceptance matrix

| Surface | Stage | Prod | Required evidence |
| --- | --- | --- | --- |
| Railway health and revision | PASS | PASS | The environment health endpoint returned 200 during the hosted check |
| Protected-resource metadata | PASS | PASS | Exact Stage and Prod JSON responses, canonical resources and `openid` scope |
| Supabase authorization discovery | PASS | PASS | Stage and Prod OAuth metadata, DCR endpoints and JWKS are exposed |
| Native Codex connection | UNVERIFIED | UNVERIFIED | Fresh profile, existing-account OAuth, `tools/list` |
| Native Claude connection | UNVERIFIED | UNVERIFIED | Fresh profile, existing-account OAuth, `tools/list` |
| Owner-scoped task management | UNVERIFIED | UNVERIFIED | Task rail blocker details, task commands, Subtasks and Projects |
| Cross-user and cross-environment isolation | UNVERIFIED | UNVERIFIED | Two existing accounts and both resources |
| Refresh, reconnect and grant revoke | UNVERIFIED | UNVERIFIED | Host credential lifecycle and server read-back |
| Rollback | BLOCKED | BLOCKED | Railway history retains no previous successful revision for recovery smoke |

Hosted acceptance cannot be marked PASS from static artifacts. Stage now exposes
the OAuth authorization-server contract, but a real client registration,
authorization-code exchange, host connection and owner-isolation run still need
to be performed. Supabase native OAuth tokens use the `authenticated` audience
and `client_id`, and support standard OIDC scopes such as `openid`; custom
`tasks:read` scopes are not currently supported. The Onward Stage resource is
exposes the fixed owner-scoped task-management tool set.

## Install and connect runbook

1. Select the package directory for exactly one environment.
2. Add that package as a local plugin in the target host's desktop or native
   plugin surface.
3. Enable the `onward` MCP connection and start its connect action.
4. Complete the browser OAuth flow with an existing account from the same
   environment. Review the Onward task-list access request before approval.
5. Confirm `tools/list` exposes `list_tasks`, `get_task`, `create_task`,
   `update_task`, `send_task_message`, the three Subtask tools and the three
   Project tools.
6. Call `list_tasks` for the default active view, archived view and one
   owner-scoped project filter, then inspect a blocked task with `get_task`.
7. Keep Stage and Prod packages installed side by side. Do not move a package
   between environments or paste a token into the package configuration.

If discovery, consent, token exchange or `tools/list` fails, record the host
name, host version, package identity, endpoint, redacted response status and
timestamp in `Europe/Madrid`. Do not record tokens, authorization codes,
email addresses or Task titles.
