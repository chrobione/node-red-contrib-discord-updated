const { clone } = require('./lib/json-utils.js');
module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');

  function discordReactionManager(config) {
    RED.nodes.createNode(this, config);
    var configNode = RED.nodes.getNode(config.token);
    var node = this;

    discordBotManager.getBot(configNode).then(function (bot) {
      node.status({
        fill: "green",
        shape: "dot",
        text: "Ready"
      });

      var reactionCollectors = [];

      const checkIdOrObject = (check) => {
        try {
          if (typeof check !== 'string') {
            if (check.hasOwnProperty('id')) {
              return check.id;
            } else {
              return false;
            }
          } else {
            return check;
          }
        } catch (error) {
          return false;
        }
      }

      const setError = (error, done) => {
        const message = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
        const errObj = error instanceof Error ? error : new Error(message);
        node.status({
          fill: "red",
          shape: "dot",
          text: message
        })
        node.error(errObj);
        if (typeof done === 'function') {
          done(errObj);
        }
      }

      const getMessage = async (message, channel) => {
        let channelInstance = await bot.channels.fetch(channel);
        return await channelInstance.messages.fetch(message);
      }

      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };
        const message = checkIdOrObject(msg.message);
        const channel = checkIdOrObject(msg.channel);
        const collectionTime = msg.time || 600000;

        if (!channel) {
          setError("msg.channel isn't a string or object", done);
          return;
        }
        if (!message) {
          setError("msg.message isn't a string or object", done);
          return;
        }

        let messageObject;
        try {
          messageObject = await getMessage(message, channel);
        } catch (error) {
          setError("channel or message missing?", done);
          return;
        }

        const collector = messageObject.createReactionCollector({
          time: collectionTime,
          dispose: true,
          remove: true,
        });
        
        reactionCollectors.push(collector);
        node.status({
          fill: "green",
          shape: "dot",
          text: "Collector created"
        });

        collector.on('remove', async (reaction, user) => {
          try {
            let messageUser = await bot.users.fetch(reaction.message.author.id);
            let reactor = await user.fetch(true);

            const newMsg = {
              payload: reaction._emoji.name,
              count: reaction.count,
              type: "remove",
              message: clone(reaction.message),
              user: clone(reactor),
              _originalFlowMessage: msg
            }
            newMsg.message.user = clone(messageUser);

            send(newMsg);
            node.status({
              fill: "green",
              shape: "dot",
              text: "Reaction remove"
            });
          } catch (error) {
            setError(error, done);
          }
        });


        collector.on('collect', async (reaction, user) => {
          try {
            let messageUser = await bot.users.fetch(reaction.message.author.id);
            let reactor = await user.fetch(true);

            const newMsg = {
              payload: reaction._emoji.name,
              count: reaction.count,
              type: "set",
              message: clone(reaction.message),
              user: clone(reactor),
              _originalFlowMessage: msg
            }
            newMsg.message.user = clone(messageUser);

            send(newMsg);
            node.status({
              fill: "green",
              shape: "dot",
              text: "Reaction sent"
            });
          } catch (error) {
            setError(error, done);
          }
        });

      });

      node.on('close', function () {
        reactionCollectors.forEach(function (collector) {
          collector.stop();
        });
        discordBotManager.closeBot(bot);
      });

    }).catch(function (err) {
      node.error(err);
      node.status({
        fill: "red",
        shape: "dot",
        text: err
      });
    });
  }

  RED.nodes.registerType("discordReactionManager", discordReactionManager);
}
