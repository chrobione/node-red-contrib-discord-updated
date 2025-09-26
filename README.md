# node-red-contrib-discord-updated

Node-red nodes that allow you to interact with Discord, via [Discord.js](https://discord.js.org).

Currently the following actions are supported:
* Receive messages from any Discord servers your BOT is in.
* Send messages in a specific channel.
* Send private messages to users.
* Send and edit embed messages.
* Add attachments to messages.
* Edit, reply, delete messages in a channel.
* Publish messages to announcements channels.
* React to messages with emojis.
* Listen for reactions on a message.
* Listen for interactions on a message button or select menu.
* Listen for interactions on commands.
* Submit modals.
* Set Status text of the Bot
* Get permissions of a specific user. Add and remove roles. Listen when a user joins or leaves a guild.
* Change channel's name.
* Allow full control over the BOT by access to the DiscordJS client.
* Create, update, delete and get Application commands.
* Create, delete and get events.
* Obtain info and change name of a guild.

This project began as [node-red-contrib-discord](https://github.com/jorisvddonk/node-red-contrib-discord) by Joris vd Donk and was expanded by Mark Koudstaal in the [node-red-contrib-discord-advanced](https://github.com/Markoudstaal/node-red-contrib-discord-advanced) fork. The code, npm package, and credits from those earlier efforts are intentionally preserved here.

The repository now lives at [chrobione/node-red-contrib-discord-updated](https://github.com/chrobione/node-red-contrib-discord-updated) so the community, myself included, can push toward the remaining Discord.js functionality without losing any of the prior work.

As of this update, a lot of under-the-hood work has landed to stabilise the fork; you can review the living plans and notes under [`upgradedocs/`](upgradedocs/) alongside the latest changes captured in [`CHANGELOG.md`](CHANGELOG.md). The current major release is **4.0.0**, reflecting the breaking changes introduced by the palette regrouping, help rewrites, and Node 20 baseline.

## Quick start
- Create a Discord application with a bot token and invite it to a test guild.
- In Node-RED, open *Settings → Manage palette → Install* and add `node-red-contrib-discord-updated`.
- Drop a **discord-token** configuration node into the editor, paste your bot token, and share it with the runtime nodes below.
- Start with a **discordMessage** node wired to a debug node so you can see inbound activity, then add the action nodes you need.
- Use **discordMessageManager** or **discordInteractionManager** as your primary “send a response back” nodes once you have confirmed connectivity.
- The palette now lists groups as `discord · event intake`, `discord · responses`, `discord · guild control`, and `discord · advanced tools`; start in Event Intake, then wire Responses, Guild Control, and Advanced Tools nodes as your flow grows.

## Node groups at a glance (palette labels)
- **discord · event intake** – `discordMessage`, `discordMember`, `discordReactionManager`, `discordInteraction`: entry points that emit flow messages when Discord activity happens.
- **discord · responses** – `discordMessageManager`, `discordInteractionManager`, `discordTyping`: nodes that send, edit, or acknowledge activity back to Discord. Use `discordInteractionManager` for slash-command/button/select replies; keep `discordMessageManager` for channel/DM messages and follow-up edits.
- **discord · guild control** – `discordCommandManager`, `discordChannelName`, `discordGuildManager`, `discordEventManager`, `discordPermissions`, `discordEmojiManager`, `discordRoleManager`: management tooling for commands, guilds, channels, events, roles, and custom emojis.
- **discord · advanced tools** – `discordActivity`, `discordClient`: status updates and advanced access to the underlying Discord.js client.

## Installation and documentation

The [Wiki](https://github.com/Markoudstaal/node-red-contrib-discord-advanced/wiki) is still being written when it comes to documentation but you can find a guide on how to install and setup the nodes [here](https://github.com/Markoudstaal/node-red-contrib-discord-advanced/wiki/Installation-and-setup).

### Developing outside of `.node-red`

If you are contributing to the nodes or testing local changes, you do not have to clone the repository inside your live `~/.node-red` directory. A typical workflow is:

1. Clone this repository anywhere you prefer, for example:

   ```bash
   git clone https://github.com/chrobione/node-red-contrib-discord-updated.git ~/dev/node-red-contrib-discord-updated
   cd ~/dev/node-red-contrib-discord-updated
   ```

2. Install dependencies from the project root:

   ```bash
   npm install
   ```

3. To use the development version inside a Node-RED user directory, either

   - run `npm install <path-to-clone>` from your Node-RED user directory (for example `~/.node-red`), or
   - use `npm link`:

     ```bash
     # from the cloned project root
     npm link

     # from your Node-RED user directory
     cd ~/.node-red
     npm link node-red-contrib-discord-updated
     ```

4. Restart Node-RED so it picks up the linked package. You can now edit code in your development directory and restart Node-RED to test changes.

Remember to remove the link (`npm uninstall node-red-contrib-discord-updated`) when you want to return to the published version from npm.

### Publishing to the Node-RED library

Publishing a Node-RED node to the public flow library is essentially publishing an npm package, with a few extra metadata requirements. The checklist for `node-red-contrib-discord-updated` is:

1. Ensure the package name in `package.json` starts with `node-red-contrib-` (in this project it is `node-red-contrib-discord-updated`).
2. Verify the `node-red` section in `package.json` correctly lists all nodes, icons, and categories.
3. Update the changelog and README to reflect the release notes.
4. Run tests and lint checks, then build any assets required by your nodes.
5. Authenticate with npm using an account that has publish rights to the package scope.
6. From the project root, publish with `npm publish` (or `npm publish --access public` for the initial release).

Within an hour or so, the Node-RED flow library will automatically index the new version based on the npm publish event. For more details, see the [official Node-RED publishing guide](https://nodered.org/docs/creating-nodes/packaging#publishing-your-node).

## Nodes

node-red-contrib-discord-updated gives you access to 15 nodes:

* **discordMessage** is a node with no inputs and one output allowing you to receive notifications of incoming messages.
* **discordMessageManager** allows (embed) messages to be sent to either channels or privatly to user. It also allows for editing and deleting of (embed) messages, including suppressing embeds or notifications.
* **discordReactionManager** that allows you to listen to reactions on a message.
* **discordPermissions** allows you to check the permissions of a specifc user. This is useful when you get the user from another source than the discordMessage node. discorPermissions lets you to add role to an user and to remove role.
* **discordClient** is an advanced deprecated node with one input and one output allowing you to inject a references to a [Discord.js Client](https://discord.js.org/#/docs/main/stable/class/Client) into a message. This node can cause node-red to crash if you use it improperly, so take caution. Messages containing a Discord.js Client reference can *not* be forked (e.g. sent to two nodes), so you'll have to manually remove the reference to the Client via a function node using `delete msg.discord`.
* **discordInteraction** allows you to listen to commands, buttons, select menus (string, user, role, channel, mentionable) and decide how to respond to them.
* **discordInteractionManager** allows you to edit interactions by id.
* **discordChannelName** allows you to change a channel's name.
* **discordMember** listens when a user joins or leaves a guild.
* **discordTyping** creates a 'bot is typing...' message on a channel.
* **discordEventManager** allows you to create, delete, and get info events (including stage and voice scheduled events).
* **discordGuildManager** allows you to get info about guilds and change name of of guilds.
* **discordCommandManager** allows you to create, update and delete global application commands and guild application commands, including name/description localisations.
* **discordEmojiManager** lets you create, update, list, and delete custom guild emojis.
* **discordRoleManager** lists members for a role or returns a quick count with pagination support.

## Changelog

See `CHANGELOG.md` for more info, including information regarding breaking changes per version.

## Key migration points for 4.0.0
- **Palette regrouping** – Nodes now appear under `discord · event intake`, `discord · responses`, `discord · guild control`, and `discord · advanced tools`. Update any screenshots or onboarding guides and look for the new names in editor search.
- **Node help refresh** – Every node panel documents inputs/outputs and recommended usage. Spend a minute skimming the help for nodes you rely on if you need a refresher.
- **Node.js baseline** – 4.0.0 requires Node.js 20 or newer and Node-RED 4.x, matching the new engine constraints in `package.json`.
- **Interaction replies** – Interactions (slash commands, buttons, selects, modals) must be answered with `discordInteractionManager` so the interaction token stays valid. `discordMessageManager` remains available for regular channel messages, DMs, and follow-up edits, but should not be wired directly to interaction events.

### Carryover from 3.5.x
Older migration notes still apply: the project always defers interaction replies before responding, and flows that pre-date 3.5.0 should review the [interaction examples](https://github.com/Markoudstaal/node-red-contrib-discord-advanced/wiki/Interaction-Examples) to avoid broken responses.

[Examples](https://github.com/Markoudstaal/node-red-contrib-discord-advanced/wiki/Interaction-Examples)


## Privileged Intents for correct functioning

![](https://raw.githubusercontent.com/Markoudstaal/node-red-contrib-discord-advanced/main/assets/privileged_intents.png)

## Support, issues and feature requests

For support in setting up and feature requests you can contact me on [this](https://discord.gg/xTPfDnS4JG) Discord.
Issues can also be reported there but prefferably via GitHub.

## Discord.js client sharing

All nodes share Discord.js clients based on the `discord-token` that they were configured with. That means that, when you add many `discordMessage` nodes configured with the exact same token, only a single connection with Discord will be made.
