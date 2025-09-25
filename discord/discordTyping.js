module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');

  function discordTyping(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);

    discordBotManager.getBot(configNode).then(function (bot) {
      
      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };

        const channel = config.channel || msg.channel || null;

        const setError = (error) => {
          const message = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
          const errObj = error instanceof Error ? error : new Error(message);
          node.status({
            fill: "red",
            shape: "dot",
            text: message
          })
          node.error(errObj, msg);
          done(errObj);
        }

        const setSuccess = (succesMessage) => {
          node.status({
            fill: "green",
            shape: "dot",
            text: succesMessage
          });

          done();
        }

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

        const getChannel = async (id) => {
          const channelID = checkIdOrObject(id);
          if (!channelID) {
            throw (`msg.channel wasn't set correctly`);
          }
          return await bot.channels.fetch(channelID);
        }

        let channelInstance = null;

        try {          
          channelInstance = await getChannel(channel);
        }
        catch( err2 ){
          setError(err2);
        }

        if ( channelInstance != null ){
          await channelInstance.sendTyping();    
          setSuccess("Typing signal sent")
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
  }

  RED.nodes.registerType("discordTyping", discordTyping);
};
