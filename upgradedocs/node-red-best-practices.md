# Node-RED Best-Practice Checklist (Discord Nodes Upgrade)

## Core Runtime Patterns
- **Node creation**: Always call `RED.nodes.createNode(this, config);` before using node instance. Avoid storing `this` on outer scopes.
- **Async handlers**: Use `(msg, send, done)` signature; default `send`/`done` from `RED.util` when not supplied. Call `done(err)` on failure and `done()` on success; never throw inside async block.
- **Status reporting**: Use `node.status({ fill, shape, text })` to surface progress/errors. Clear or set to idle when work completes. Avoid leaving stale error states.
- **Error handling**: Prefer `node.error(err, msg)` and `node.warn` instead of `console.log`. Ensure caught exceptions propagate via callbacks.
- **Resource cleanup**: Register `node.on('close', ...)` to release event listeners, timers, and shared clients (via `discordBotManager.closeBot`). Guard against multiple closures.
- **Shared resources**: Centralise Discord client access through config nodes; avoid additional global singletons beyond `discordBotManager` cache.
- **Credential safety**: Use credential fields for tokens; never log token values; return minimal data in status messages.
- **Node help text**: Keep `.html` help sections accurate; document new inputs/outputs (message flags, bulk delete options, channel ID requirements, emoji management) as features are added.

## Coding Guidelines
- Avoid implicit globals (`use strict` or `const/let`).
- Prevent long-running blocking operations inside handlers; prefer async/await.
- Validate incoming `msg` properties and provide actionable error messages.
- Support cloning/serialisation by avoiding raw Discord objects on `msg` where possible (use `Flatted` outputs as already adopted).

## Testing Expectations
- Provide unit coverage for core logic (formatters, managers, bulk/emoji/voice utilities) using `mocha` + `should` + `sinon`.
- Use `node-red-node-test-helper` for flow-level integration tests; ensure helper is stopped after each suite.
- Target >80% statement coverage on modified modules.

## Audit Approach
1. Build per-node checklist (status usage, `send/done`, error handling, credential hygiene, close handler, documentation).
2. Review each runtime JS file under `discord/` against the checklist.
3. Capture findings in task notes; update code, help text, and associated tests where gaps exist.
4. Append changelog entries once each remediation lands.

## Initial Observations
- Existing nodes use `node.status` but may not clear success states; confirm.
- Several modules use `console.log` for errors (e.g., command manager catch blocks); replace with `node.error`.
- Interaction cache currently leaks due to plain object without eviction.
- Command manager occasionally lacks application ID; ensure fetch occurs before REST calls and surface clearer diagnostics.
- Some nodes may not call `done()` within async handlers (verify `discordInteractionManager`, `discordEventManager`).
- Message manager already supports searching, but documentation should highlight channel ID requirements and search usage to avoid confusion.
- HTML help files need updates once new features (message flags, bulk delete, emoji management, role queries, voice events) are added.
