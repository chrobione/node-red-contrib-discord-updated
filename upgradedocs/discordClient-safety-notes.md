# discordClient Safety Net

## Goals
- Prevent the legacy `discordClient` node from crashing Node-RED when flows branch, reuse messages, or shut down unexpectedly.
- Keep the raw Discord.js client out of the cloned `msg` structure while still giving advanced users a deterministic way to access it.
- Ensure the underlying bot connection and cached handles are cleaned up when flows end.

## Key Changes (Implemented)
- **Tokenised client lookup**: each message gets a unique token (`${msg._msgid}:${node.id}`) stored in an in-memory map. Cloned branches can call `msg.discord.get()` or read the non-enumerable `msg.discordClient` getter to obtain the live client without sharing heavyweight references on the message itself.
- **Explicit drop hook**: `msg.discord.drop()` (and the TTL fallback) removes the cached client once the user is finished, preventing unbounded growth.
- **Overwrite protection**: if a message already contains a `discord` property, the node throws immediately so stealth client swaps cannot occur.
- **Close guard**: the node tracks all issued tokens and clears them alongside `closeBot(bot)` when the node shuts down, avoiding double-teardowns.

## Follow-up Work
- Reintroduce unit tests for the new handle (token issuance, getter/drop behaviour, cleanup on close) once the Node-RED test helper better supports multi-wire scenarios.
- Update public documentation with the new usage pattern (`msg.discord.get()`, `msg.discord.drop()`), alongside guidance encouraging the specialised nodes whenever possible.
