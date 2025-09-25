# Programming Spec

## Goals
- Raise the runtime baseline to actively supported Node.js releases (target Node 20 LTS) and align documentation/CI with that guarantee.
- Upgrade `discord.js` to the latest published release and keep other runtime/test dependencies current (`flatted`, `node-red`, `mocha`, `sinon`, `node-red-node-test-helper`).
- Stabilise the existing feature set immediately after the dependency upgrades by addressing known bugs (interaction cache leak, implicit globals, BigInt prototype mutation, command manager application ID handling) so current flows keep working.
- After the runtime refactor is stable, adopt key discord.js capabilities introduced since 14.11.0 so flows can take advantage of the modern Discord feature set.
- Ensure the upgraded stack remains functional across all nodes, with automated tests covering critical flows and regressions.
- Align node implementation with Node-RED best practices (naming, status updates, error handling, resource cleanup, credential handling, test coverage) as part of the stabilisation work.
- Record every user-facing or behavioural change in `CHANGELOG.md` as work progresses.
- Rebrand the package to `node-red-contrib-discord-advanced` across metadata, documentation, and release assets while maintaining upgrade guidance for existing users.
- Improve onboarding documentation so new Node-RED users understand where to start and how each Discord node fits common workflows.
- Harden the legacy `discordClient` node so misuse cannot crash Node-RED; sandbox direct client access behind guardrails and fail gracefully.

## Key Dependencies & Version Targets
- **discord.js**: Bump from `^14.11.0` to the latest release. Confirm the exact version with `npm show discord.js version` during implementation. Review upstream changelog between 14.11.0 and the target version for breaking changes (notable items: stricter `AttachmentBuilder` validation, interaction response behaviour changes, REST response typings).
- **flatted**: Update to the latest patch (>= 3.2.9) to align with upstream serialization fixes.
- **node-red**: Lift from `^2.2.2` to `^4.0.2` (requires Node >= 18). Ensure flows and test helper APIs remain compatible under Node 20.
- **Testing stack**: `mocha` >= 10, `sinon` >= 17, `should` latest 13.x, `node-red-node-test-helper` (currently pinned to ^0.2.7 until a 4.x-compatible release is available). Update test bootstrap code if helper APIs change when a newer helper is published.
- **Node.js baseline**: Update `engines.node` to `>=20` in `package.json`, adjust `.npmrc` (engine-strict) accordingly, refresh README badges, and update GitHub Actions workflow Node versions (consider a matrix for Node 18 and 20).

## Compatibility Risks & Mitigations
- **discord.js API drift**
  - `REST#delete` may return `void`; adjust success checks in `discord/discordCommandManager.js` (delete/deleteAll) to treat the absence of payload as success.
  - Validation of builders tightened: ensure `messagesFormatter` coerces `{ buffer, name }` attachment objects to valid buffers and raises informative errors when data is missing.
  - Confirm `GuildScheduledEventManager` constructor expectations; supply any new required arguments.
  - Interaction flows: verify each branch in `discord/discordInteraction.js` passes required options (`ephemeral`, response types) to defer and reply methods.
  - Ensure the command manager always resolves and caches the bot application ID before issuing REST calls to avoid `application_id` snowflake errors.
- **Node-RED 4.x upgrade**
  - Update tests to await helper start/stop Promises. Confirm runtime APIs used in nodes are still stable (`node.error`, `node.status`, etc.).
- **Node.js 20 baseline**
  - Run `npm test` locally under Node 20 and ensure no deprecation warnings. Adjust optional dependencies if they rely on older Node APIs.
- **Tooling changes**
  - npm bundled with Node 20 (v9) upgrades `package-lock.json` to lockfileVersion 3; accept the churn and ensure release tooling handles it.

## Core Code Changes (Stabilisation Phase)
- Replace the plain object cache in `discord/lib/interactionManager.js` with a `Map`, and remove entries after retrieval (or after a timeout) to prevent memory leaks. Add unit coverage for cache eviction.
- Fix implicit globals:
  - `discord/lib/discordFramework.js`: declare `const guild = await getGuild(bot, id);` before instantiating `GuildScheduledEventManager`.
  - `discord/discordEventManager.js`: declare `const eventScheduledEndTime = _eventScheduledEndTime ? new Date(_eventScheduledEndTime) : null;` and reuse locally.
- Remove global `BigInt.prototype.toJSON` mutation. Provide a serialization helper (e.g., custom replacer for `Flatted.stringify`) and apply it wherever `Flatted` is used.
- Update `discord/discordCommandManager.js` to handle REST success responses that return `void`, ensure the bot application ID is populated (with retries/error messages if missing), and to log/propagate HTTP errors clearly.
- Harden `discord/lib/messagesFormatter.js` to validate attachments/components per the updated discord.js builder APIs.
- Review each node for Node-RED best practices: ensure `node.status` is cleared or updated appropriately, errors are reported via `node.error`, asynchronous handlers use `send/done`, and resources are freed in `close` handlers.
- Document configuration expectations (e.g., channel must be a Snowflake ID) directly in node help/labels.
- Update GitHub Actions workflow to use `actions/setup-node@v4`, Node 20 (plus optional Node 18 matrix), and enable npm caching.
- Refresh documentation (`README.md`, `CHANGELOG.md`, node help) to reflect the new Node baseline, upgraded discord.js version, and clarified configuration guidance.
- Rename package metadata from `node-red-contrib-discord-advanced` to `node-red-contrib-discord-advanced`, including `package.json`, npm publish configuration, README badges, and install instructions; provide migration notes for downstream flows.

## Feature Upgrades (Post-Stabilisation)
- **Entity select menus (types 5-9)**: Extend `messagesFormatter.formatComponents` to support the builders `UserSelectMenuBuilder`, `RoleSelectMenuBuilder`, `MentionableSelectMenuBuilder`, `ChannelSelectMenuBuilder`, and `AttachmentSelectMenuBuilder`, and surface configuration from Node-RED messages.
- **Scheduled event stage support**: Allow `discord/discordEventManager.js` to create Stage Instance events (`GuildScheduledEventEntityType.StageInstance`), accept stage channel IDs, and optionally upload event images where supported.
- **Localized command metadata**: Expand `discord/discordCommandManager.js` inputs to handle `name_localizations` and `description_localizations` when registering commands.
- **Attachment metadata controls**: Update `messagesFormatter.formatAttachments` to expose newer `AttachmentBuilder` options such as `description`, `spoiler`, or durations where relevant.
- **Custom emoji management**: Discord.js supports setting/retrieving/deleting custom server emojis, which should be exposed by adding Node-RED nodes or enhancements that manage guild emoji lifecycles (create, fetch, update, delete) with appropriate validation.
- **Message flags & notifications**: Allow send/edit operations to set Discord message flags (e.g., suppress embeds, suppress notifications) via node configuration or message properties.
- **Bulk message delete/search tooling**: Add APIs to fetch recent messages (last N) and delete in bulk with optional filters (e.g., skip pinned, older than date) without requiring the raw client node.
- **Voice channel join/leave events**: Provide a node or enhancement to emit events when members join/leave voice channels, leveraging Discord voice state updates.
- **Ephemeral interaction replies**: Enable the interaction manager to reply to button/select interactions with ephemeral messages by exposing the ephemeral flag in node inputs/options.
- **Role membership queries**: Add utilities to list member IDs for a given role, enabling downstream flows without custom scripting.
- **Auto moderation APIs**: Investigate the newer auto-moderation managers/events exposed by discord.js and define the scope for a future Node-RED node (document findings; implementation may require design approval before coding).
- **Guild onboarding/prompts**: Review discord.js Guild Onboarding endpoints and outline what additional Node-RED nodes or enhancements would be needed to manage prompts; capture requirements for later implementation.
- **Node icon and categorisation improvements**: Provide distinct icons/categories for each Discord node to improve visual differentiation in the Node-RED palette.

## Testing Plan
- **Unit Coverage Expansion**
  - Add granular tests for `messagesFormatter` covering buttons, legacy select menus, each new entity select type, attachment metadata permutations, message flag handling, and emoji payload validation (including error cases for invalid data).
  - Extend `discordCommandManager` specs to exercise `set`, `get`, `delete`, `deleteAll` flows using sinon-mocked REST clients, including scenarios with localisation fields, guild/global variants, and missing application IDs.
  - Add tests for `discordEventManager` that validate voice, stage, and external event creation paths, required field enforcement, and image handling.
  - Add tests for emoji management utilities/nodes to ensure create/update/delete operations marshal payloads correctly and handle REST failures.
  - Add tests for bulk message fetch/delete logic, including pinned and date-filtered scenarios.
  - Add tests for voice state event handling to ensure join/leave events are emitted and cleaned up properly.
  - Create targeted tests for the interaction cache to ensure entries are retrieved once, evicted on timeout, and that concurrent interactions do not leak references.
  - Ensure BigInt serialization helper is unit-tested across representative payloads (messages, events, interactions) to confirm round-tripping behaviour.
  - Add tests verifying role membership queries return expected arrays under different guild configurations.
- **Node-RED Integration Tests**
  - Update existing helper-based specs to Node-RED 4.x conventions and add flows covering entity selects, stage events, command localisation, emoji management, bulk delete/search operations, message flags, role queries, and voice event emissions end-to-end.
  - Introduce regression flows for legacy behaviours (message create/edit/delete, reactions, permissions) to guard against unintended breakage during the upgrade.
- **Cross-Version & Platform Testing**
  - Run the entire suite on Node 18 and Node 20 (local + CI) to confirm compatibility and catch engine-specific issues.
  - Validate on Linux (CI default) and at least one additional environment locally (e.g., Windows or macOS) to surface OS-specific path or encoding issues introduced by upgrades.
- **Manual & Exploratory Testing**
  - Execute smoke tests against a Discord staging guild covering: message send/edit/reply, interaction flows with new select menus, stage event scheduling, command registration with localisation, emoji lifecycle operations, message flag behaviour, bulk deletes, and role member lookups.
  - Manually verify auto-moderation and guild onboarding discovery notes by probing available endpoints; record findings and any blockers in the changelog or follow-up tickets.
  - Capture screenshots/logs for updated documentation where behaviour changed (e.g., new node configuration fields for localisation, select menus, emoji management, message flags, channel ID guidance).
- **Quality Gates**
  - Target >80% statement coverage on upgraded modules (`messagesFormatter`, `discordCommandManager`, `discordEventManager`, `interactionManager`, emoji/bulk/voice utilities).
  - Enable CI coverage reporting (nyc + coveralls/codecov optional) to enforce the coverage threshold.
  - Ensure linting (if available) runs clean; if no lint step exists, add a lightweight `npm run lint` placeholder for future enforcement.
  - Confirm `npm pack` succeeds post-upgrade to catch packaging issues before publish.

## Implementation Steps
### Phase 1 – Upgrade & Stabilisation
1. Determine the exact dependency versions (`discord.js`, `node-red`, testing stack) via npm and document them in the changelog once decided.
2. Update `package.json` dependencies/devDependencies and regenerate `package-lock.json` using Node 20/npm 9.
3. Implement the core code changes (interaction cache, globals, BigInt serialization, command manager application ID handling, REST response handling, formatter validation, Node-RED best practice adjustments, documentation clarifications).
4. Update CI workflow, README, badges, and other docs to reflect the new Node baseline.
5. Rename project assets to `node-red-contrib-discord-advanced` (package metadata, badges, npm scripts, install docs, GitHub workflow names) and provide guidance for consumers upgrading from the previous package name.
6. Update or create tests needed to confirm existing functionality still passes under Node 18/20 and the upgraded `discord.js`/Node-RED 4.0.2 stack.
7. Run the full automated suite on Node 18 and 20; resolve any regressions uncovered.
8. Perform manual Node-RED smoke testing to ensure the product is back to a stable state before adding new features.
9. Record each change in `CHANGELOG.md`, clearly labelling fixes, dependency upgrades, behaviour adjustments, and the package rename.

### Phase 2 – Feature Upgrades
10. Implement entity select menu, stage event, localisation, attachment metadata, message flag, bulk delete/search, custom emoji management, role membership queries, voice event handling, and ephemeral interaction reply enhancements once the stabilisation tests pass.
11. Conduct discovery work for auto-moderation and guild onboarding APIs, documenting findings and scoping follow-up tasks.
12. Deliver node icon/categorisation improvements for better palette usability, grouping nodes into onboarding, messaging, administration, and utility categories inside the Node-RED palette (category split now published as `discord: listen/respond/manage/utilities`; icon refresh still pending).
13. Extend automated and manual tests to cover the new feature behaviour.
14. Update documentation and changelog with newly supported features, usage examples (including channel ID guidance), and Node-RED best practice notes.
15. Finalise release notes summarising breaking changes, the package rename, and new feature support; confirm `npm pack`/publish flow succeeds.

## Out of Scope
- Introducing features beyond those explicitly listed in the Feature Upgrades section without separate design approval.
- Refactoring unrelated modules unless required by dependency upgrades or Node-RED best practice compliance.
