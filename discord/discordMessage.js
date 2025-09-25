const { clone } = require('./lib/json-utils.js');
module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');

  function discordMessage(config) {
    RED.nodes.createNode(this, config);
    var configNode = RED.nodes.getNode(config.token);
    var channelFilterList = cleanChannelFilterList(config.channelIdFilter);
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
      }

      registerCallback('messageCreate', message => {
        if (message.author !== bot.user) {
          var msgid = RED.util.generateId();
          var msg = {
            _msgid: msgid
          }
          msg.payload = message.content;
          msg.channel = clone(message.channel);
          msg.member = clone(message.member);
          msg.memberRoleNames = message.member ? message.member.roles.cache.each(function (item) {
            return item.name
          }) : null;
          msg.memberRoleIDs = message.member ? message.member.roles.cache.each(function (item) {
            return item.id
          }) : null;

          try {            
            msg.data = clone(message);
            msg.data.attachments = clone(message.attachments);
            msg.data.reference = message.reference;
          } catch (e) {
            node.warn("Could not set `msg.data`: JSON serialization failed");
          }
          
          if (channelFilterList && !channelFilterList.includes(msg.channel.id)){
            return;
          } else if (message.author.bot) {
            msg.author = {
              id: message.author.id,
              bot: message.author.bot,
              system: message.author.system,
              flags: message.author.flags,
              username: message.author.bot,
              discriminator: message.author.discriminator,
              avatar: message.author.avatar,
              createdTimestamp: message.author.createdTimestamp,
              tag: message.author.tag,
            }
            node.send(msg);
          } else {
            message.author.fetch(true).then(author => {
              msg.author = clone(author);
              node.send(msg);
            }).catch(error => {
              node.error(error);
              node.status({
                fill: "red",
                shape: "dot",
                text: error
              });
            });
          }
        }
      });

      registerCallback('error', error => {
        node.error(error);
        node.status({
          fill: "red",
          shape: "dot",
          text: error
        });
      });

      node.on('close', function () {
        callbacks.forEach(function (cb) {
          bot.removeListener(cb.eventName, cb.listener);
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
  RED.nodes.registerType("discordMessage", discordMessage);
};

function cleanChannelFilterList(channelFilterList)
{
  if (!channelFilterList)  
    return;  

  var cleanedChannelFilterList = null;
  if (channelFilterList.startsWith(',') && channelFilterList.endsWith(','))
  {
    cleanedChannelFilterList = channelFilterList.slice(1, -1);
  } else if (channelFilterList.startsWith(',')) {
    cleanedChannelFilterList = channelFilterList.slice(1);
  } else if (channelFilterList.endsWith(',')) {
    cleanedChannelFilterList = channelFilterList.slice(0, -1);
  } else {
    cleanedChannelFilterList = channelFilterList;
  }
  return cleanedChannelFilterList.split(',');
}
