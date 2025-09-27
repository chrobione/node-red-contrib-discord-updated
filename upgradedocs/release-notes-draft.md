# Release Notes Draft – v4.0.0

## Breaking Changes
- Node-RED deployments must run on Node.js 20 or newer. The package now targets `discord.js` 14.15.x and the refreshed Node-RED 4.0 runtime/test stack.

## Highlights
- Added new nodes for emoji administration, role membership queries, and voice-state events.
- Interaction flows support entity select menus, localisation, ephemeral replies, and follow-up lifecycle controls out of the box.
- Message tooling gains bulk fetch/delete actions with safety nets plus attachment metadata and message flag controls to match Discord’s latest APIs.
- The raw `discordClient` node now issues per-message handles (`msg.discord.get()/drop()`) so branching flows stay stable.

## Quality & Reliability
- Interaction cache rebuilt on a timed `Map`, BigInt serialisation handled via a scoped helper, and the command manager now guarantees application ID resolution and clean REST error propagation.
- All nodes were audited for Node-RED best practices (status, `send/done`, credential hygiene) with improved error output and palette icons/grouping for faster discovery.

## Documentation & Onboarding
- README, examples, and inline help rewritten to point to the new repository, clarify channel/interaction responsibilities, and walk newcomers through common flows.
- New `interactionFollowupLifecycle` example demonstrates ephemeral replies and follow-up edits/deletes end to end.

## Upgrade Checklist
1. Upgrade your runtime to Node.js 20 before installing v4.0.0.
2. Review flows that inject the raw Discord client; switch to `msg.discord.get()` / `msg.discord.drop()` or transition to the specialised nodes.
3. Re-run `npm install` to refresh dependencies, then exercise new node help/examples to validate your use cases.
4. If you extend the test suite, keep `node-red-node-test-helper` pinned at ^0.2.7 until the upstream publishes a Node-RED 4 compatible release.

