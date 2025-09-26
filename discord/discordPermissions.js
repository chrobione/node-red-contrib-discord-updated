module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  const { clone } = require('./lib/json-utils.js');

  function discordPermissions(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);
    discordBotManager.getBot(configNode).then(function (bot) {
      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };
        const action = msg.action || 'get';
        const user = msg.user || null;
        const guild = msg.guild || null;
        const role = msg.role || null;
        const roleQuery = msg.roleQuery || {};

        const setError = (error) => {
          const statusText = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
          const errObj = error instanceof Error ? error : new Error(statusText);
          node.status({
            fill: "red",
            shape: "dot",
            text: statusText
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

        const fetchMembersByRole = async () => {
          const guildID = checkIdOrObject(guild);
          const roleID = checkIdOrObject(roleQuery.role || role);

          if (!guildID) {
            setError(`msg.guild wasn't set correctly`);
            return;
          }

          if (!roleID) {
            setError(`msg.role wasn't set correctly`);
            return;
          }

          const limit = Math.min(Math.max(roleQuery.limit || 1000, 1), 5000);
          const pageLimit = Math.min(Math.max(roleQuery.pageLimit || 10, 1), 100);
          const includePresences = roleQuery.includePresences === true;

          try {
            const guildObject = await bot.guilds.fetch(guildID);
            let fetched = [];
            let after = roleQuery.after ? roleQuery.after.toString() : undefined;

            for (let page = 0; page < pageLimit && fetched.length < limit; page++) {
              const remaining = Math.min(limit - fetched.length, 1000);
            const members = await guildObject.members.fetch({
              limit: remaining,
              after,
              withPresences: includePresences,
            });

            if (!members || !members.size) {
              break;
            }

              members.each(member => {
                if (member.roles.cache.has(roleID)) {
                  fetched.push(clone(member));
                }
              });

              if (members.size < remaining) {
                break;
              }

              after = members.last().id;
            }

            msg.payload = fetched;
            send(msg);
            setSuccess(`members fetched for role ${roleID}`);
          } catch (error) {
            setError(error);
          }
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

        const sendRoles = async () => {
          const userID = checkIdOrObject(user);
          const guildID = checkIdOrObject(guild);

          if (!userID) {
            setError(`msg.user wasn't set correctly`);
          } else if (!guildID) {
            setError(`msg.guild wasn't set correctly`);
          } else {

            try {
              const guildObject = await bot.guilds.fetch(guildID);
              const userObject = await guildObject.members.fetch(userID);

              const roles = [];
              userObject.roles.cache.each(role => {
                roles.push(clone(role));
              });
              msg.payload = roles;
              msg.discordUser = clone(userObject);
              send(msg);
              setSuccess(`roles sent`);
            } catch (error) {
              setError(error);
            }
          }
        }

        const setRole = async () => {
          const userID = checkIdOrObject(user);
          const guildID = checkIdOrObject(guild);
          const roleID = checkIdOrObject(role);

          if (!userID) {
            setError(`msg.user wasn't set correctly`);
          } else if (!guildID) {
            setError(`msg.guild wasn't set correctly`);
          } else if (!roleID) {
            setError(`msg.role wasn't set correctly`);
          } else {
            try {
              const guildObject = await bot.guilds.fetch(guildID);
              const userObject = await guildObject.members.fetch(userID);

              await userObject.roles.add(roleID);
              msg.payload = "role set";
              send(msg);
              setSuccess(`role set`);
            } catch (error) {
              setError(error);
            }
          }
        }

        const removeRole = async () => {
          const userID = checkIdOrObject(user);
          const guildID = checkIdOrObject(guild);
          const roleID = checkIdOrObject(role);

          if (!userID) {
            setError(`msg.user wasn't set correctly`);
          } else if (!guildID) {
            setError(`msg.guild wasn't set correctly`);
          } else if (!roleID) {
            setError(`msg.role wasn't set correctly`);
          } else {
            try {
              const guildObject = await bot.guilds.fetch(guildID);
              const userObject = await guildObject.members.fetch(userID);

              await userObject.roles.remove(roleID);
              msg.payload = "role removed";
              send(msg);
              setSuccess(`role removed`);
            } catch (error) {
              setError(error);
            }
          }
        }

        switch (action.toLowerCase()) {
          case 'get':
            await sendRoles();
            break;
          case 'set':
            await setRole();
            break;
          case 'remove':
            await removeRole();
            break;
          case 'list':
            await fetchMembersByRole();
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
  RED.nodes.registerType("discordPermissions", discordPermissions);
}
