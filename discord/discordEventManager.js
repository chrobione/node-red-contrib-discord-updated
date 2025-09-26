module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  var discordFramework = require('./lib/discordFramework.js');
  const { clone } = require('./lib/json-utils.js');
  const {
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    ChannelType,
  } = require('discord.js');


  function discordEventManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);

    discordBotManager.getBot(configNode).then(function (bot) {
      node.on('input', async function (msg, send, done) {
        send = send || node.send.bind(node);
        done = done || function (err) { if (err) { node.error(err, msg); } };
        
        const _guildID = config.guild || msg.guild || null;
        const _eventID = config.event || msg.event || null;
        const _action = msg.action || "info";

        const _eventName = msg.eventName || null;
        const _eventScheduledStartTime = msg.scheduledStartTime || null;
        const _eventScheduledEndTime = msg.scheduledEndTime || null;
        const _eventEventType = msg.eventType || "external";
        const _eventChannel = msg.channel || null;
        const _eventImage = null; //To-do.....
        const _eventReason = msg.reason || null;
        const _eventDescription = msg.description || null;
        const _eventLocation = msg.eventLocation || null;

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

        

        const infoEvent = async () => {
          try {
            let eventManager = await discordFramework.getEventManager(bot, _guildID);

            const eventID = discordFramework.checkIdOrObject(_eventID);

            let event = await eventManager.fetch(eventID)

            setSuccess(`event ${event.id} info obtained`, event);
          } catch (err) {
            setError(err);
          }
        }

        const getEvents = async () => {
          try {
            let eventManager = await discordFramework.getEventManager(bot, _guildID);

            let events = await eventManager.fetch()

            setSuccess(`events [${events.size}] obtained`, events);
          } catch (err) {
            setError(err);
          }
        }

        const deleteEvent = async () => {
          try {
            let eventManager = await discordFramework.getEventManager(bot, _guildID);

            const eventID = discordFramework.checkIdOrObject(_eventID);

            let event = await eventManager.fetch(eventID)
            let deleted = await eventManager.delete(event)

            setSuccess(`event ${event.id} deleted`, deleted);
          } catch (err) {
            setError(err);
          }
        }

        const createEvent = async () => {

          try {

            let eventManager = await discordFramework.getEventManager(bot, _guildID);
            const eventName = discordFramework.checkIdOrObject(_eventName);

            if (!eventName) {
              throw new Error(`msg.eventName wasn't set correctly`);
            }

            if (_eventScheduledStartTime == null) {
              throw new Error(`msg.scheduledStartTime wasn't set correctly`);
            }

            const normalizedType = _eventEventType.toString().toLowerCase();
            let entityType;
            let eventMetadata = undefined;
            let eventChannelId = null;

            if (normalizedType === 'external') {
              if (_eventLocation == null) {
                throw new Error(`msg.eventLocation wasn't set correctly, it is required when event type is set to external`);
              }

              if (_eventScheduledEndTime == null) {
                throw new Error(`msg.eventScheduledEndTime wasn't set correctly, it is required when event type is set to external`);
              }

              entityType = GuildScheduledEventEntityType.External;
              eventMetadata = { location: _eventLocation };
            } else if (normalizedType === 'voice' || normalizedType === 'stage') {
              const channel = await discordFramework.getChannel(bot, _eventChannel);
              if (!channel) {
                throw new Error(`msg.channel wasn't set correctly, it is required when event type is set to ${normalizedType}`);
              }

              if (normalizedType === 'voice') {
                if (channel.type !== ChannelType.GuildVoice) {
                  throw new Error("msg.channel must reference a voice channel when event type is set to voice");
                }
                entityType = GuildScheduledEventEntityType.Voice;
              } else {
                if (channel.type !== ChannelType.GuildStageVoice) {
                  throw new Error("msg.channel must reference a stage channel when event type is set to stage");
                }
                entityType = GuildScheduledEventEntityType.StageInstance;
              }

              eventChannelId = channel.id;
            } else {
              throw new Error(`msg.eventType wasn't set correctly, ${_eventEventType} is not a valid event type`);
            }

            const eventScheduledEndTime = _eventScheduledEndTime ? new Date(_eventScheduledEndTime) : null;
            const eventPayload = {
              name: eventName,
              scheduledStartTime: new Date(_eventScheduledStartTime),
              privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
              entityType,
              description: _eventDescription,
              image: null,
              reason: _eventReason,
            };

            if (eventChannelId) {
              eventPayload.channel = eventChannelId;
            }

            if (eventMetadata) {
              eventPayload.entityMetadata = eventMetadata;
            }

            if (eventScheduledEndTime) {
              eventPayload.scheduledEndTime = eventScheduledEndTime;
            }

            let event = await eventManager.create(eventPayload);

            setSuccess(`event ${event.id} created`, event);
          } catch (err) {
            setError(err);
          }
        }



        switch (_action.toLowerCase()) {
          case 'info':
            await infoEvent();
            break;
          case 'all':
              await getEvents();
              break;
          case 'create':
            await createEvent();
            break;
          case 'delete':
            await deleteEvent();
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
  RED.nodes.registerType("discordEventManager", discordEventManager);
};
