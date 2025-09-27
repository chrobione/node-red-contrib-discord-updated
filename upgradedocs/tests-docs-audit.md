# Tests & Documentation Audit – Phase 2 Features

| Area | Automated Coverage | User-Facing Docs | Gaps / Follow-up |
| --- | --- | --- | --- |
| Entity select menus | `test/messagesFormatter_spec.js:5` exercises entity select action rows. | Help text for `discordInteraction.html` and `discordInteractionManager.html` (multi-select inputs) plus README highlight. | Flow-based integration test still pending for multi-branch scenarios. |
| Stage event validation | `test/discordEventManager_spec.js:34` + `:74` cover stage success/error paths. | `discord/discordEventManager.html` explains stage channel requirement. | None identified. |
| Command localisation | `test/discordCommandManager_spec.js:30` asserts localisations mapping. | `discord/discordCommandManager.html` lists localisation fields. | None identified. |
| Message flags (`suppressEmbeds`, `suppressNotifications`) | No dedicated spec—flag passthrough indirectly covered by interaction tests for ephemeral flags. | `discord/discordMessageManager.html:66` and `discord/discordInteractionManager.html` describe options. | Add targeted tests for flag combinations and message manager branch. |
| Bulk fetch/delete | Missing automated specs for `bulkDelete`/`bulkFetch`. | Help text in `discord/discordMessageManager.html` enumerates filters. | Add tests simulating filtered bulk operations and error handling. |
| Emoji management | `test/discordEmojiManager_spec.js` covers create/delete flows. | `discord/discordEmojiManager.html` documents usage and size checks. | Update docs with image size constraints screenshots (optional). |
| Role membership queries | `test/discordRoleManager_spec.js` verifies pagination/count logic; `test/discordPermissions_role_query_spec.js` covers permissions node lookups. | Help text in `discord/discordRoleManager.html` and permissions node updated. | None identified. |
| Voice state events | `test/discordVoiceState_spec.js` covers join/leave emissions. | `discord/discordVoiceState.html` documents payload. | None identified. |
| Attachment metadata | `test/messagesFormatter_spec.js:52` ensures metadata mapping. | `discord/discordMessageManager.html` & README mention metadata fields. | None identified. |
| Ephemeral replies & follow-ups | `test/discordInteractionManager_spec.js:15`–`:90` cover ephemeral reply + follow-up lifecycle. | Help text and README updated; example flow `interactionFollowupLifecycle.json`. | None identified. |
| discordClient safety net | Existing tests pending (Node-RED helper limitation). Draft notes in `upgradedocs/discordClient-safety-notes.md`. | README callout plus node help emphasise new handle. | Add unit coverage once multi-wire helper issue resolved. |

## Summary
- High-priority additions: specs for message flag passthrough (non-ephemeral flags), bulk message actions, and future `discordClient` handle regression tests.
- Documentation: mostly current; consider adding visuals for emoji file requirements in a follow-up.
