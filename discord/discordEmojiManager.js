const path = require('path');
const fs = require('fs/promises');
const { clone } = require('./lib/json-utils.js');
const discordBotManager = require('./lib/discordBotManager.js');
const discordFramework = require('./lib/discordFramework.js');

const DATA_URI_REGEX = /^data:(?<mime>.+);base64,(?<data>.*)$/;
const MAX_EMOJI_SIZE = 256 * 1024; // 256 KB

const resolveImage = async (image) => {
  if (!image) {
    throw new Error('emoji.image was not provided');
  }

  if (Buffer.isBuffer(image)) {
    if (image.length > MAX_EMOJI_SIZE) {
      throw new Error('emoji.image exceeds Discord\'s 256KB size limit');
    }
    return image;
  }

  if (typeof image === 'string') {
    const dataMatch = image.match(DATA_URI_REGEX);
    if (dataMatch) {
      const buffer = Buffer.from(dataMatch.groups.data, 'base64');
      if (buffer.length > MAX_EMOJI_SIZE) {
        throw new Error('emoji.image exceeds Discord\'s 256KB size limit');
      }
      return buffer;
    }

    if (/^https?:\/\//i.test(image)) {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Unable to download emoji image (${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > MAX_EMOJI_SIZE) {
        throw new Error('emoji.image exceeds Discord\'s 256KB size limit');
      }
      return buffer;
    }

    const filePath = path.resolve(image);
    const buffer = await fs.readFile(filePath);
    if (buffer.length > MAX_EMOJI_SIZE) {
      throw new Error('emoji.image exceeds Discord\'s 256KB size limit');
    }
    return buffer;
  }

  throw new Error('emoji.image must be a Buffer, data URI, URL, or file path');
};

module.exports = function (RED) {
  function discordEmojiManager(config) {
    RED.nodes.createNode(this, config);
    const configNode = RED.nodes.getNode(config.token);
    const node = this;

    discordBotManager.getBot(configNode).then((bot) => {
      node.on('input', async (msg, send, done) => {
        send = send || node.send.bind(node);
        done = done || ((err) => { if (err) { node.error(err, msg); } });

        const setError = (error) => {
          const message = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
          const errObj = error instanceof Error ? error : new Error(message);
          node.status({ fill: 'red', shape: 'dot', text: message });
          node.error(errObj, msg);
          done(errObj);
        };

        const setSuccess = (status, payload) => {
          node.status({ fill: 'green', shape: 'dot', text: status });
          msg.payload = payload === undefined ? null : clone(payload);
          send(msg);
          done();
        };

        try {
          const action = (msg.action || 'list').toLowerCase();
          const guildId = config.guild || msg.guild || msg.guildId;

          if (!guildId) {
            throw new Error("msg.guild wasn't set correctly");
          }

          const guild = await discordFramework.getGuild(bot, guildId);
          const emojiManager = guild.emojis;

          const createEmoji = async () => {
            const emojiInput = msg.emoji || {};
            const name = emojiInput.name;
            if (!name || typeof name !== 'string') {
              throw new Error('emoji.name must be provided');
            }

            const imageBuffer = await resolveImage(emojiInput.image);
            const options = {
              name,
              attachment: imageBuffer,
            };

            if (Array.isArray(emojiInput.roles)) {
              options.roles = emojiInput.roles;
            }

            const created = await emojiManager.create(options, emojiInput.reason);
            setSuccess(`Emoji ${created.name} created`, created);
          };

          const updateEmoji = async () => {
            const emojiId = msg.emojiId || msg.emoji?.id;
            if (!emojiId) {
              throw new Error('emojiId was not provided');
            }

            const updates = {};
            const emojiInput = msg.emoji || {};

            if (emojiInput.name) {
              updates.name = emojiInput.name;
            }

            if (Array.isArray(emojiInput.roles)) {
              updates.roles = emojiInput.roles;
            }

            if (emojiInput.image) {
              updates.image = await resolveImage(emojiInput.image);
            }

            if (Object.keys(updates).length === 0) {
              throw new Error('No update fields were provided');
            }

            const updated = await emojiManager.edit(emojiId, updates, emojiInput.reason);
            setSuccess(`Emoji ${updated.name} updated`, updated);
          };

          const deleteEmoji = async () => {
            const emojiId = msg.emojiId || msg.emoji?.id;
            if (!emojiId) {
              throw new Error('emojiId was not provided');
            }

            if (msg.deleteConfirm !== true) {
              throw new Error('Emoji deletion aborted: set msg.deleteConfirm = true to acknowledge the destructive action.');
            }

            const reason = msg.reason || msg.emoji?.reason;
            const deleted = await emojiManager.delete(emojiId, reason);
            setSuccess(`Emoji ${emojiId} deleted`, deleted);
          };

          const listEmojis = async () => {
            const emojis = await emojiManager.fetch();
            setSuccess(`Fetched ${emojis.size} emojis`, Array.from(emojis.values()));
          };

          switch (action) {
            case 'create':
              await createEmoji();
              break;
            case 'update':
              await updateEmoji();
              break;
            case 'delete':
              await deleteEmoji();
              break;
            case 'list':
              await listEmojis();
              break;
            default:
              throw new Error('msg.action has an incorrect value');
          }
        } catch (error) {
          setError(error);
        }
      });

      node.on('close', () => {
        discordBotManager.closeBot(bot);
      });
    }).catch((err) => {
      node.error(err);
      node.status({ fill: 'red', shape: 'dot', text: err && err.message ? err.message : err });
    });
  }

  RED.nodes.registerType('discordEmojiManager', discordEmojiManager);
};
