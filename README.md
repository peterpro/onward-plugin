# Onward plugin packages

This workspace generates standalone MCP plugin packages for the two hosted
Onward environments:

- `plugins/onward-stage/` points to the Stage resource
- `plugins/onward-prod/` points to the Prod resource

Both packages are generated from the same source definitions. The portable
root files are `plugin.json` and `mcp.json`. Compatibility files for Codex and
Claude are emitted alongside them, and do not contain credentials.

Environment data is kept in `config/environments/`. The shared package
contract lives in `src/shared/`, while `src/package-definitions.mjs` loads the
two public environment definitions. No package reads from the Onward checkout
at runtime.

The package uses the hosted OAuth authorization flow at connection time. The
build does not contact Supabase or Railway and does not mutate provider state.
Supabase currently supports standard OIDC scopes only, so the package requests
`openid`. The Stage and Prod resources expose owner-scoped task, subtask and
project read/write tools, and the Onward consent screen explains this fixed
task-management capability.

## Verify locally

```text
pnpm check
```

The check rebuilds both packages, verifies their manifests and endpoints, and
confirms that a repeated build produces identical output.

The developer acceptance packet is in `docs/acceptance.md`. It separates static
package evidence from hosted OAuth and host UI evidence that still requires the
corresponding environment and user accounts.

## GitHub distribution

The repository contains two host-specific marketplace catalogs generated from
the same package definitions:

- `.agents/plugins/marketplace.json` for Codex
- `.claude-plugin/marketplace.json` for Claude Code

The catalogs expose both `onward-stage` and `onward-prod`. For a release
snapshot, add the GitHub repository at the corresponding immutable tag.

Stage:

    codex plugin marketplace add https://github.com/peterpro/onward-plugin.git --ref v0.1.2-stage.1 --sparse .agents/plugins --sparse plugins
    claude plugin marketplace add https://github.com/peterpro/onward-plugin.git#v0.1.2-stage.1 --sparse .claude-plugin plugins

Prod:

    codex plugin marketplace add https://github.com/peterpro/onward-plugin.git --ref v0.1.2 --sparse .agents/plugins --sparse plugins
    claude plugin marketplace add https://github.com/peterpro/onward-plugin.git#v0.1.2 --sparse .claude-plugin plugins

The example tags are release-plan placeholders until the first GitHub release.
Do not put credentials into package configuration. OAuth is completed by the
host when the MCP resource is connected.
