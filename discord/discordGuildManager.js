module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  const { clone } = require('./lib/json-utils.js');

  function discordGuildManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);

    discordBotManager.getBot(configNode).then(function (bot) {
      node.status({ fill: "green", shape: "dot", text: "Ready" });

      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };
        const _guild = config.guild || msg.guild || null;
        const _action = msg.action || 'info';

        const _name = msg.name || null;
      

        const setError = (error) => {
          const statusText = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
          node.status({
            fill: "red",
            shape: "dot",
            text: statusText
          })
          node.error(error, msg);
          done(error);
        }

        const setSuccess = (succesMessage, data) => {
          node.status({
            fill: "green",
            shape: "dot",
            text: succesMessage
          });

          msg.payload = clone(data);
          send(msg);
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

        const getGuild = async (id) => {
          const guildId = checkIdOrObject(id);
          if (!guildId) {
            throw (`msg.guild wasn't set correctly`);
          }
          return await bot.guilds.fetch(guildId);
        }

        const infoGuild = async () => {
          try {
            let guild = await getGuild(_guild)
            setSuccess(`guild ${_guild} info obtained`, guild);
          } catch (err) {
            setError(err);
          }
        }

        const setGuildName = async () => {
          try {
            let guild = await getGuild(_guild)
            const name = typeof _name === 'string' ? _name.trim() : null;

            if (!name) {
              setError(`msg.name wasn't set correctly`);
              return;
            }

            const updated = await guild.setName(name);
            setSuccess(`Updated guild name to ${updated.name}`, updated);
          } catch (err) {
            setError(err);
          }
        }

    
        switch (_action.toLowerCase()) {
          case 'info':
            await infoGuild();
            break;
          case 'name':
              await setGuildName();
              break; 
          default:
            setError(`msg.action has an incorrect value`)
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
  RED.nodes.registerType("discordGuildManager", discordGuildManager);
};
