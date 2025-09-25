# Changelog Structure Plan for Upcoming Release

Target version: **4.0.0** (to reflect Node 20 baseline & feature upgrades)

## Proposed Sections
- **Breaking Changes**
  - Node.js 20+ requirement; Node 16 support removed.
  - Any API adjustments (e.g., default behaviour changes in commanders/formatters).
  - Package renamed to `node-red-contrib-discord-advanced`; document migration steps.
- **Features**
  - Entity select menu support.
  - Stage event enhancements.
  - Command localisation.
  - Message flags & notification controls.
  - Bulk message search/delete flows.
  - Custom emoji management (create/update/delete guild emojis).
  - Voice channel join/leave events.
  - Role membership queries.
  - Attachment metadata controls.
  - Ephemeral interaction replies.
  - Node icon/categorisation improvements.
  - `discordClient` guard rails to prevent Node-RED crashes during misuse.
- **Fixes**
  - Interaction cache leak resolved.
  - Implicit global variable bugs.
  - BigInt serialization safety.
  - REST response handling improvements and command manager application ID resolution.
  - Node-RED best-practice compliance updates (status, error handling, close handlers).
  - Documentation clarifications for channel IDs and message search usage.
- **Maintenance**
  - Dependency upgrades (discord.js, Node-RED, mocha/sinon, flatted).
  - CI workflow and README badge updates.
  - Onboarding documentation refresh that groups nodes by task and provides a first-flow walkthrough.
  - Auto-moderation/guild onboarding research notes (if no feature implementation yet).

## Logging Approach
- After completing each task, append a bullet to the relevant section in `CHANGELOG.md` with concise description and references (e.g., issue numbers if available).
- Keep entries in chronological order of completion; final pass will re-group if necessary before release.
