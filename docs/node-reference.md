# Node Reference

This page summarizes each node’s purpose and primary I/O so you can scan quickly. For full panel help, open the node in the editor and read the built‑in Help tab.

- discord-token (config)
  - Stores your bot token. Share this config with the runtime nodes.

- discordMessage (in)
  - Emits messages received in guild text channels, threads, and DMs.
  - Out: `payload` (message data), `channel`, `user`, `guild`, `memberRoleIDs`, `reference`.

- discordMessageManager (in/out)
  - Creates/edits/deletes/Replies to messages; adds reactions; crossposts; searches.
  - In: `action` (create|edit|delete|reply|react|crosspost|search|info|bulkdelete), `payload`, `channel` or `user`, `message`, `embeds`, `components`, `attachments`, `suppressEmbeds`, `suppressNotifications`.
  - Out: `payload` (message or array), `request` (original input).

- discordInteraction (in)
  - Emits events for slash commands, buttons, select menus, context menus, modals.
  - Options: auto‑defer reply, expose interaction object.
  - Out: `payload` (interaction details), `token`, `deferred`.

- discordInteractionManager (in/out)
  - Sends/edits/deletes interaction replies and follow‑ups; handles autocomplete.
  - In: `action` (reply|editReply|deleteReply|followUp|editFollowUp|deleteFollowUp|autocomplete), `payload`, `components`, `embeds`, `flags` (ephemeral), `interactionId/interactionToken`.
  - Out: `payload` (API result), `request`.

- discordTyping (in)
  - Triggers the “bot is typing…” indicator.
  - In: `channel` or `user`; optional `durationMs`.

- discordMember (in)
  - Emits join/leave/member update events.
  - Out: `payload` (member details), `guild`.

- discordPermissions (in/out)
  - Reads member permissions and roles; can add/remove roles.
  - In: `action` (get|addRole|removeRole|roleQuery), `user`, `role`, `guild`.
  - Out: `payload` (boolean/list/details).

- discordReactionManager (in)
  - Adds/removes reactions or listens for reactions on messages.
  - In: `action` (add|remove|listen), `message`, `emoji`.

- discordChannelName (in)
  - Renames channels.
  - In: `channel`, `name`.

- discordEventManager (in/out)
  - Creates/gets/deletes scheduled events (including stage/voice events) with validation.
  - In: `action` (create|get|delete|list), `guild`, `channel`, `scheduledStartTime`, `scheduledEndTime`, `entityType`.

- discordGuildManager (in/out)
  - Gets guild details; can rename a guild.
  - In: `action` (get|rename), `guild`, `name`.

- discordCommandManager (in/out)
  - Creates/updates/deletes application commands (global or guild), including localizations.
  - In: `action` (put|delete|get), `commands`, `guildId`, `applicationId`.

- discordEmojiManager (in/out)
  - Creates/lists/deletes custom emojis.
  - In: `action` (create|list|delete), `guild`, `image` (Buffer/URL), `name`.

- discordRoleManager (in/out)
  - Lists/counts members of a role using pagination.
  - In: `action` (list|count), `guild`, `role`, `limit`, `after`.

- discordVoiceState (in)
  - Emits voice state updates (join/leave/mute/deafen) for members.

- discordClient (advanced)
  - Exposes a Discord.js client handle. Prefer other nodes; misuse can crash Node‑RED.

Notes
- All nodes share client instances keyed by the `discord-token` config.
- Use Interaction Manager for initial interaction replies; Message Manager for regular channel/DM messages and follow‑ups.
