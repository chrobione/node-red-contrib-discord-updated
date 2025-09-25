const { clone } = require('./lib/json-utils.js');
module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');

  function discordMember(config) {
    RED.nodes.createNode(this, config);
    var configNode = RED.nodes.getNode(config.token);
    var node = this;

    discordBotManager.getBot(configNode).then(function (bot) {
      var callbacks = [];
      node.status({
        fill: "green",
        shape: "dot",
        text: "ready"
      });

      var registerCallback = function (eventName, listener) {
        callbacks.push({
          'eventName': eventName,
          'listener': listener
        });
        bot.on(eventName, listener);
      };

      registerCallback('guildMemberAdd', member => {
        try {
          var msgid = RED.util.generateId();
          var msg = {
            _msgid: msgid,
            payload: clone(member)
          };
          msg.payload.event = "guildMemberAdd";
          node.send(msg);
        } catch (error) {
          node.error(error);
          node.status({ fill: "red", shape: "dot", text: error && error.message ? error.message : 'guildMemberAdd error' });
        }
      });

      registerCallback('guildMemberRemove', member => {
        try {
          var msgid = RED.util.generateId();
          var msg = {
            _msgid: msgid,
            payload: clone(member)
          };
          msg.payload.event = "guildMemberRemove";
          node.send(msg);
        } catch (error) {
          node.error(error);
          node.status({ fill: "red", shape: "dot", text: error && error.message ? error.message : 'guildMemberRemove error' });
        }
      });

      node.on('close', function () {
        callbacks.forEach(function (cb) {
          bot.removeListener(cb.eventName, cb.listener);
        });
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
  
  RED.nodes.registerType("discordMember", discordMember);
};
