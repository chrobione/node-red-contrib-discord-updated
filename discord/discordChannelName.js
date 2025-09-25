module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  const { checkIdOrObject } = require('./lib/discordFramework.js');

  function discordChannelName(config) {
    RED.nodes.createNode(this, config);
    var configNode = RED.nodes.getNode(config.token);
    var node = this;

    discordBotManager.getBot(configNode).then(function (bot) {
      node.status({ fill: "green", shape: "dot", text: "Ready" });

      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };

        try {
          const rawChannel = config.channel || msg.channel || null;
          const channelId = checkIdOrObject(rawChannel);
          if (!channelId) {
            throw new Error("msg.channel wasn't set correctly (expecting a channel ID or object with id)");
          }

          const newName = (msg.name || '').trim();
          if (!newName) {
            throw new Error('msg.name must be a non-empty string');
          }

          const channel = await bot.channels.fetch(channelId);
          await channel.setName(newName);

          node.status({
            fill: "green",
            shape: "dot",
            text: "Channel renamed"
          });

          msg.payload = { channel: channelId, name: newName };
          send(msg);
          done();
        } catch (error) {
          const statusText = error && error.message ? error.message : 'Failed to rename channel';
          const errObj = error instanceof Error ? error : new Error(statusText);
          node.status({
            fill: "red",
            shape: "dot",
            text: statusText
          });
          node.error(errObj, msg);
          done(errObj);
        }
      });

      node.on('close', function () {
        discordBotManager.closeBot(bot);
      });

    }).catch(err => {
      node.error(err);
      node.status({
        fill: "red",
        shape: "dot",
        text: err && err.message ? err.message : err
      });
    });
  };
  RED.nodes.registerType("discordChannelName", discordChannelName);
};
