module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  const { checkIdOrObject } = require('./lib/discordFramework.js');
  const { clone } = require('./lib/json-utils.js');
  const { REST, Routes } = require('discord.js');
  
  const remapLocalizationKeys = (input) => {
    if (Array.isArray(input)) {
      return input.map(item => remapLocalizationKeys(item));
    }

    if (!input || typeof input !== 'object') {
      return input;
    }

    const target = { ...input };

    if (target.nameLocalizations && target.name_localizations === undefined) {
      target.name_localizations = target.nameLocalizations;
      delete target.nameLocalizations;
    }

    if (target.descriptionLocalizations && target.description_localizations === undefined) {
      target.description_localizations = target.descriptionLocalizations;
      delete target.descriptionLocalizations;
    }

    if (target.valueLocalizations && target.value_localizations === undefined) {
      target.value_localizations = target.valueLocalizations;
      delete target.valueLocalizations;
    }

    if (target.options) {
      target.options = target.options.map(option => remapLocalizationKeys(option));
    }

    if (target.choices) {
      target.choices = target.choices.map(choice => remapLocalizationKeys(choice));
    }

    return target;
  };
  

  function discordCommandManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);

    var bot = discordBotManager.getBot(configNode)

    bot.then(function (botInstance) {
      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };

        const ensureApplicationId = async () => {
          if (!botInstance || !botInstance.application) {
            throw new Error('Discord client is not initialised');
          }

          if (!botInstance.id) {
            try {
              const application = await botInstance.application.fetch();
              if (application && application.id) {
                botInstance.id = application.id;
              }
            } catch (err) {
              throw new Error(`Unable to resolve application id: ${err.message || err}`);
            }
          }

          if (!botInstance.id) {
            throw new Error('Unable to resolve application id for the Discord bot');
          }

          return botInstance.id;
        };

        const _guildId = config.guild || msg.guild || msg.guildId || null;
        const _action = msg.action || null;
        const _commands = msg.commands || msg.command || msg.commandId || null;
        const _commandID = msg.commandId || null;

        const setError = (error) => {
          const message = typeof error === 'string' ? error : (error && error.message) ? error.message : 'Unexpected error';
          node.status({
            fill: "red",
            shape: "dot",
            text: message
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

          msg.payload = data === undefined ? null : clone(data);
          send(msg);
          done();
        }

        const deleteCommand = async () => {
          try {
            const commandId = _commandID;
            const rest = new REST({ version: '10' }).setToken(botInstance.token);
            const guildId = checkIdOrObject(_guildId);
            const applicationId = await ensureApplicationId();

            if (!commandId) {
              setError(`msg.commandId wasn't set correctly`);
              return;
            }

            if (guildId) {
              await rest.delete(Routes.applicationGuildCommand(applicationId, guildId, commandId));
              setSuccess(`Successfully deleted application (/) command '${commandId}'.`);
              return;
            }

            await rest.delete(Routes.applicationCommand(applicationId, commandId));
            setSuccess(`Successfully deleted application (/) command '${commandId}'.`);
          } catch (err) {
            setError(err);
          }
        }

        const getCommands = async () => {
          try {
            const rest = new REST({ version: '10' }).setToken(botInstance.token);
            const commandId = checkIdOrObject(_commandID);
            const guildId = checkIdOrObject(_guildId);
            const applicationId = await ensureApplicationId();

            if (guildId) {
              if (commandId) {
                const data = await rest.get(Routes.applicationGuildCommand(applicationId, guildId, commandId));
                setSuccess(`Successfully retrieved application (/) command '${commandId}'.`, data);
              } else {
                const data = await rest.get(Routes.applicationGuildCommands(applicationId, guildId));
                setSuccess(`Successfully retrieved application (/) commands for guild '${guildId}'.`, data);
              }
              return;
            }

            if (commandId) {
              const data = await rest.get(Routes.applicationCommand(applicationId, commandId));
              setSuccess(`Successfully retrieved application (/) command '${commandId}'.`, data);
            } else {
              const data = await rest.get(Routes.applicationCommands(applicationId));
              setSuccess(`Successfully retrieved global application (/) commands.`, data);
            }
          } catch (err) {
            setError(err);
          }
        }

        const deleteAllCommand = async () => {
          try {
            const rest = new REST({ version: '10' }).setToken(botInstance.token);
            const guildId = checkIdOrObject(_guildId);
            const applicationId = await ensureApplicationId();

            if (guildId) {
              await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: [] });
              setSuccess(`Successfully deleted guild application (/) commands for '${guildId}'.`);
              return;
            }

            await rest.put(Routes.applicationCommands(applicationId), { body: [] });
            setSuccess(`Successfully deleted all global application (/) commands.`);
          } catch (err) {
            setError(err);
          }
        }

        const setCommand = async () => {
          try {

            let commands = _commands;

            if (commands == null) {
              setError(`msg.commands wasn't set correctly`);
              return;
            }

            if (!Array.isArray(commands)) {
              commands = [commands];
            }

            const normalizedCommands = commands.map(cmd => remapLocalizationKeys(clone(cmd)));

            const rest = new REST({ version: '10' }).setToken(botInstance.token);
            const guildId = checkIdOrObject(_guildId);
            const applicationId = await ensureApplicationId();

            if (guildId) {
              const data = await rest.post(
                Routes.applicationGuildCommands(applicationId, guildId),
                { body: normalizedCommands },
              );
              setSuccess(`Successfully reloaded ${data.length} guild application (/) commands.`, data);
              return;
            }

            const data = await rest.post(
              Routes.applicationCommands(applicationId),
              { body: normalizedCommands },
            );
            setSuccess(`Successfully reloaded ${data.length} global application (/) commands.`, data);
          } catch (err) {
            setError(err);
          }
        }
       
        if (_action == null) {
          setError(`msg.action has no value`)
        }
        else {
          switch (_action.toLowerCase()) {
            case 'set':
              await setCommand();
              break;            
            case 'delete':
              await deleteCommand();
              break;
            case 'deleteall':
              await deleteAllCommand();
              break;
            case 'get':
              await getCommands();
              break;
            default:
              setError(`msg.action has an incorrect value`)
          }
        }
      });

      node.on('close', function () {
        discordBotManager.closeBot(botInstance);
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
  RED.nodes.registerType("discordCommandManager", discordCommandManager);
};
