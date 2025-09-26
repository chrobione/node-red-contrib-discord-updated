const { clone } = require('./lib/json-utils.js');
const discordBotManager = require('./lib/discordBotManager.js');
const discordFramework = require('./lib/discordFramework.js');

const checkIdOrObject = (check) => {
  try {
    if (typeof check !== 'string' && check?.id) {
      return check.id;
    }
    return check || false;
  } catch (err) {
    return false;
  }
};

const fetchMembersByRole = async (guild, roleId, options = {}) => {
  const limit = Math.min(Math.max(options.limit || 1000, 1), 5000);
  const pageLimit = Math.min(Math.max(options.pageLimit || 10, 1), 100);
  const withPresences = options.includePresences === true;
  const afterStart = options.after ? options.after.toString() : undefined;

  let fetched = [];
  let after = afterStart;

  for (let page = 0; page < pageLimit && fetched.length < limit; page++) {
    const remaining = Math.min(limit - fetched.length, 1000);
    const members = await guild.members.fetch({ limit: remaining, after, withPresences });

    if (!members || !members.size) {
      break;
    }

    members.each(member => {
      if (member.roles.cache.has(roleId)) {
        fetched.push(clone(member));
      }
    });

    if (members.size < remaining) {
      break;
    }
    after = members.last().id;
  }

  return fetched;
};

module.exports = function (RED) {
  function discordRoleManager(config) {
    RED.nodes.createNode(this, config);
    const configNode = RED.nodes.getNode(config.token);
    const node = this;

    discordBotManager.getBot(configNode).then(bot => {
      node.on('input', async (msg, send, done) => {
        send = send || node.send.bind(node);
        done = done || (err => { if (err) node.error(err, msg); });

        const setError = (error) => {
          const message = typeof error === 'string' ? error : error?.message || 'Unexpected error';
          const errObj = error instanceof Error ? error : new Error(message);
          node.status({ fill: 'red', shape: 'dot', text: message });
          node.error(errObj, msg);
          done(errObj);
        };

        const setSuccess = (status, payload) => {
          node.status({ fill: 'green', shape: 'dot', text: status });
          msg.payload = payload === undefined ? null : payload;
          send(msg);
          done();
        };

        try {
          const action = (msg.action || 'listMembers').toLowerCase();
          const guildId = config.guild || msg.guild || msg.guildId;

          if (!guildId) {
            throw new Error("msg.guild wasn't set correctly");
          }

          const guild = await discordFramework.getGuild(bot, guildId);

          switch (action) {
            case 'listmembers': {
              const roleId = checkIdOrObject(msg.role || msg.roleQuery?.role);
              if (!roleId) {
                throw new Error("msg.role wasn't set correctly");
              }
              const members = await fetchMembersByRole(guild, roleId, msg.roleQuery);
              setSuccess(`Fetched ${members.length} members`, members);
              break;
            }
            case 'count': {
              const roleId = checkIdOrObject(msg.role);
              if (!roleId) {
                throw new Error("msg.role wasn't set correctly");
              }
              const role = await guild.roles.fetch(roleId);
              if (!role) {
                throw new Error(`Unable to fetch role '${roleId}'`);
              }
              setSuccess(`Role ${roleId} member count`, { roleId, count: role.members.size });
              break;
            }
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
    }).catch(err => {
      node.error(err);
      node.status({ fill: 'red', shape: 'dot', text: err?.message || err });
    });
  }

  RED.nodes.registerType('discordRoleManager', discordRoleManager);
};
