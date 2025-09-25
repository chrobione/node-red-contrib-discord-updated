# Dependency Version Targets (to confirm during implementation)

| Package | Current (package.json) | Target Version (to verify) | Notes |
| --- | --- | --- | --- |
| discord.js | ^14.11.0 | ^14.15.3 (latest 14.x release as of 2024-10) | Recheck prior to install; assess changes in REST typings & builders. |
| flatted | ^3.2.5 | ^3.2.9 | Minor patch updates only. |
| node-red | ^2.2.2 | ^4.0.2 | Requires Node >= 18; verify compatibility with Node 20 baseline and update helper tests accordingly. |
| mocha (dev) | ^9.2.2 | ^10.4.0 | Node 14+ support; breaking changes in 10.x to address. |
| sinon (dev) | ^13.0.2 | ^17.0.1 | Requires Node 14+; adjust import pattern if needed. |
| should (dev) | ^13.2.3 | ^13.2.3 (latest) | No newer major; confirm patch status. |
| node-red-node-test-helper (dev) | ^0.2.7 | ^0.2.7 (latest available) | Monitor for a future 0.4.x release that formally supports Node-RED 4.x. |

> **Note**: Verify all target versions via `npm info <pkg> version` once network access is available or prior to committing lockfile changes.
