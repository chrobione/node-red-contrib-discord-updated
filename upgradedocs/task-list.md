# Programming Task List

## Phase 0 – Preparation & Research
- [x] Capture Node-RED best-practice guidance (status updates, error handling, credentials, node help text) and note current gaps for each node.
  - Action plan: Review the latest Node-RED docs and style guides; build a checklist of required behaviours; audit each node file against the checklist; record discrepancies per node in project notes.
- [x] Record latest stable versions for `discord.js`, `flatted`, `node-red`, `mocha`, `sinon`, `should`, and `node-red-node-test-helper`.
  - Action plan: Use `npm show <pkg> version` (or official release notes) to capture versions; verify compatibility requirements; document chosen versions in prep notes.
- [x] Define supported Node.js matrix (minimum Node 20, optional Node 18) for documentation and CI.
  - Action plan: Confirm Node-RED and discord.js minimum engine requirements; decide whether Node 18 remains in support; document decision for README/CI updates.
- [x] Plan CHANGELOG structure; add entries only as individual tasks complete.
  - Action plan: Review existing changelog format; outline upcoming sections (Breaking, Features, Fixes, Maintenance) without adding specific entries yet; ensure format supports incremental additions.

## Phase 1 – Upgrade & Stabilisation
### Dependency & Configuration Updates
- [x] Bump runtime dependencies in `package.json` and regenerate `package-lock.json` using Node 20/npm 9; log change in changelog.
  - Action plan: Update dependency versions, run `npm install` under Node 20, inspect lockfile for intended updates, and queue changelog entry upon completion.
- [x] Update devDependencies (Node-RED 4.x, test stack) and adjust npm scripts/configs; log change in changelog.
  - Action plan: Modify devDependency versions, rerun install, update test scripts if APIs changed, and note adjustments for changelog once verified.
- [x] Set `engines.node` to `>=20` and confirm `.npmrc` enforces engine strictness; log change in changelog.
  - Action plan: Edit `package.json` engines, verify `.npmrc` settings, run `npm install` to ensure engine check triggers correctly, then document.
- [x] Update `.github/workflows/npm-publish.yml` to use `actions/setup-node@v4`, Node 20 matrix (optionally Node 18), and npm cache; log change in changelog.
  - Action plan: Modify workflow YAML, run `act` or dry-run if possible, and record updates once validated.
- [x] Refresh README badges and supported-version text for Node 20/discord.js; log change in changelog.
  - Action plan: Update badges and narrative text, cross-check for accuracy, capture screenshots if needed, and note change in changelog.
- [x] Rename package metadata to `node-red-contrib-discord-advanced` (package.json name, README badges, npm scripts, npm publish settings); log change in changelog.
  - Action plan: Update `package.json` name/description, adjust README references, revise CI/job names if required, ensure npm install instructions use the new name, and add migration guidance.

### Core Code Fixes & Best-Practice Alignment
- [x] Replace interaction cache with `Map` + eviction in `discord/lib/interactionManager.js`; add tests and changelog note.
  - Action plan: Refactor cache implementation, introduce configurable eviction logic, update unit tests, and document change once tests pass.
- [x] Fix implicit globals in `discord/lib/discordFramework.js` and `discord/discordEventManager.js`; add tests and changelog note.
  - Action plan: Declare missing variables locally, add regression tests confirming isolation, and log fix after verification.
- [x] Introduce BigInt serialization helper and remove prototype mutation; add tests and changelog note.
  - Action plan: Create helper utility, update serialization callers, write unit tests for BigInt handling, and document change.
- [x] Update `discord/discordCommandManager.js` to handle void REST responses, guarantee application ID retrieval, and improve error propagation; add tests and changelog note.
  - Action plan: Adjust REST call handling, ensure application ID is fetched/cached, refine success/error messages, mock REST layer in tests, and log updates.
- [x] Harden `discord/lib/messagesFormatter.js` for attachment/component validation; add tests and changelog note.
  - Action plan: Implement validation checks, extend formatter tests for new scenarios, and record outcomes.
- [x] Audit every node (`discordMessage`, `discordMessageManager`, `discordPermissions`, `discordReactionManager`, `discordChannelName`, `discordMember`, `discordActivity`, `discordClient`, `discordInteraction`, `discordInteractionManager`, `discordTyping`, `discordGuildManager`, `discordEventManager`, `discordCommandManager`) for Node-RED best practices (status handling, `send/done`, credential safety, close handlers) and remediate issues; document each fix in changelog.
  - Action plan: Apply the best-practice checklist node by node, refactor code where gaps exist, add targeted tests when behaviour changes, and log every remediation in the changelog incrementally.
- [x] Clarify configuration expectations (e.g., channel must be an ID) in node help/labels and README; log documentation change.
  - Action plan: Update `.html` help files and README sections to explicitly describe required IDs vs names, include examples, and note update in changelog.

### Testing & Verification
- [x] Upgrade Node-RED helper-based tests to the 4.x API (async setup/teardown).
  - Action plan: Update helper usage patterns, ensure tests await async operations, and run suite to confirm stability.
- [x] Expand unit tests: interaction cache, command manager CRUD (with REST mocks/application ID cases), event manager validation, BigInt helper, formatter edge cases, and role lookup utilities.
  - Action plan: Create or extend test files covering each scenario, mock dependencies as needed, confirm coverage goals.
- [ ] Run automated suite on Node 20 and Node 18, ensuring parity; capture results and note in changelog. *(Node 20 passing; Node 18 run pending.)*
  - Action plan: Execute test suites under both Node versions (via nvm or CI), compare outputs, and record any differences.
- [ ] Execute Node-RED smoke flows (messages, interactions, permissions, events) against a Discord test guild; log outcome.
  - Action plan: Deploy sample flows, validate end-to-end behaviour manually, capture logs/screenshots, and document findings.

## Phase 2 – Feature Upgrades
### Entity Select Menus
- [x] Extend component formatter to cover entity select builders (types 5-9) and expose config; add tests, docs, changelog entry.
  - Action plan: Implement new component mapping, update documentation/examples, add tests covering each select type, and log feature.

### Scheduled Event Enhancements
- [x] Support stage instance events, stage channel validation, and optional image uploads in event manager; add tests, docs, changelog entry.
  - Action plan: Expand event manager options, handle validations, test new paths, update docs, and record change.

### Command Localisation
- [x] Add localisation fields to command manager inputs and ensure REST payloads include them; add tests, docs, changelog entry.
  - Action plan: Extend node configuration schema, adjust payload builder, write tests verifying localisation data, update docs, and log in changelog.

### Message Flags & Notifications
- [x] Allow message send/edit to set Discord flags (suppress embeds/notifications); add tests, docs, changelog entry.
  - Action plan: Extend message manager inputs, integrate with discord.js flag API, add tests validating behaviour, update docs, and log change.

### Bulk Message Search & Delete
- [x] Provide actions to fetch recent messages and delete in bulk with filters; add tests, docs, changelog entry.
  - Action plan: Implement new actions in message manager, support limit/filter props, add tests for pinned/date scenarios, update docs/examples, log change.

### Custom Emoji Management
- [x] Implement nodes or enhancements for creating, fetching, updating, and deleting guild emojis; add tests, docs, changelog entry.
  - Action plan: Design emoji management interface (new node or extensions), integrate with discord.js `GuildEmojiManager`, enforce validation, and cover feature with unit/integration tests before documenting and logging.

### Voice Channel Join/Leave Events
- [x] Emit events when members join/leave voice channels; add tests, docs, changelog entry.
  - Action plan: Extend existing member node or add new voice-state node, subscribe to voiceStateUpdate, add tests, update docs, and log change.

### Ephemeral Interaction Replies
- [x] Enable interaction manager to reply to button/select interactions with ephemeral messages; add tests, docs, changelog entry.
  - Action plan: Surface ephemeral flag through config/msg, adjust reply logic, add tests, update docs, and log change.

### Role Membership Queries
- [x] Provide utilities to list member IDs for a given role; add tests, docs, changelog entry.
  - Action plan: Implement role lookup function/node, mock guild/member data in tests, update docs, and log change.

### Attachment Metadata
- [x] Surface attachment metadata options (`description`, `spoiler`, duration, etc.) via formatter; add tests, docs, changelog entry.
  - Action plan: Update formatter to accept metadata, ensure compatibility with discord.js API, add tests, revise docs, and record change.

### Node Icon & Categorisation Improvements
- [ ] Deliver distinct icons/categories for Discord nodes in the palette; log docs/assets update.
  - Action plan: **Categories regrouped via `discord: listen/respond/manage/utilities`.** Next steps: design refreshed icons, update palette definitions if further tweaks needed, adjust documentation/screenshots, and log change.

### discordClient Safety Net
- [ ] Refactor `discordClient` so it fails safely (no Node-RED crashes) when flows misuse the raw client.
  - Action plan: Wrap client injection in protective checks, enforce single-use semantics, surface errors via `node.error`, document the safe usage pattern, and add tests that simulate misuse.

### Discovery & Documentation Tasks
- [ ] Research discord.js auto-moderation APIs, outline potential nodes/changes, and document findings + next steps in changelog.
  - Action plan: Review discord.js docs, prototype minimal usage if needed, draft proposal for Node-RED integration, and document findings.
- [ ] Research guild onboarding/prompt APIs and document required follow-up work in changelog.
  - Action plan: Investigate API support, evaluate feasibility for Node-RED nodes, and summarise in documentation/changelog.

### Testing & Docs for New Features
- [ ] Extend automated tests to cover new feature behaviour (entity selects, stage events, localisation, message flags, bulk delete/search, emoji management, voice events, role queries, attachment metadata, ephemeral replies).
  - Action plan: Add targeted tests for each new feature, ensure coverage thresholds met, and run suite.
- [ ] Update README/examples/help text for new features and best-practice adjustments; log in changelog.
  - Action plan: Revise documentation, example flows, inline help (including channel ID guidance and message search examples); validate accuracy; log updates.
- [ ] Perform manual regression covering new features with screenshots/logs for documentation.
  - Action plan: Execute live tests of new features, collect evidence for docs, and note results.

## Phase 2 – Feature Upgrades: Interaction & Messaging Enhancements
- [x] Add entity select menu support to `discordInteraction`/`discordInteractionManager` (builder inputs, help text, tests, docs).
- [x] Expand scheduled event tooling for stage-channel events, including validation and docs.
- [x] Add localisation fields to slash-command definitions and interaction replies.
- [x] Surface message flag controls (suppress embeds, silent notifications) in `discordMessageManager` and `discordInteractionManager`.
- [x] Implement bulk fetch/delete actions in `discordMessageManager` with filters and safety checks.
- [x] Introduce emoji management helpers (create/update/delete guild emojis) and document image requirements.
- [x] Provide role membership query utilities (list members for a role) with pagination handling.
- [x] Emit voice state join/leave events via a dedicated node and update examples.
- [x] Support attachment metadata (description, spoiler, duration) in the formatter and response nodes.
- [x] Enhance interaction replies with better ephemeral handling and follow-up tools.
- [ ] Update automated tests and documentation as each feature lands.

## Release Preparation
- [ ] Review lockfile and dependency diffs for unintended drift prior to release.
  - Action plan: Inspect `package-lock.json` changes, verify no extraneous packages, and confirm consistency with dependency updates.
- [ ] Confirm `npm pack` and publish workflow succeed with updated package.
  - Action plan: Run `npm pack`, inspect output tarball, optionally dry-run publish, and ensure CI workflow passes.
- [ ] Finalise `CHANGELOG.md` with all fixes, upgrades, and new features enumerated chronologically.
  - Action plan: Consolidate incremental changelog notes, ensure clarity/formatting, and tag release section.
- [ ] Draft release notes summarising Node 20 requirement, bug fixes, best-practice compliance, and new feature support; tag and publish once automated/manual checks pass.
  - Action plan: Summarise highlights, list breaking changes and new features, coordinate publish, and create release tag.
