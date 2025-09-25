# Node.js Support Matrix Decision

- **Minimum runtime requirement**: Node.js 20 LTS
  - Rationale: Aligns with current Active LTS, ensures compatibility with latest discord.js and security updates.
  - `package.json` `engines.node` will be set to `>=20` and `.npmrc` retains `engine-strict=true`.
- **Additional CI coverage**: Node.js 18 LTS (optional)
  - Rationale: Provide transitional assurance for users still on Node 18 while communicating deprecation timeline.
  - CI workflow will run tests on Node 20 and 18; README will state Node 18 support is best-effort during the transition period.
- **Deprecated versions**: Node 16 and below are no longer supported once the upgrade ships.
  - Update documentation and changelog to highlight the breaking change.

Follow-up: verify Node-RED 4.0.2 and the target discord.js release operate correctly on Node 20 prior to finalising release notes.
