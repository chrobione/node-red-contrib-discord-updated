const discordBotManager = require('./lib/discordBotManager.js');
const { clone } = require('./lib/json-utils.js');

module.exports = function (RED) {
  function discordVoiceState(config) {
    RED.nodes.createNode(this, config);
    const configNode = RED.nodes.getNode(config.token);
    const node = this;

    discordBotManager.getBot(configNode).then((bot) => {
      const callbacks = [];

      const register = (event, listener) => {
        callbacks.push({ event, listener });
        bot.on(event, listener);
      };

      const sendState = (type, state) => {
        const payload = {
          type,
          guildId: state.guild?.id,
          channelId: state.channelId,
          userId: state.id,
          member: clone(state.member),
          deaf: state.deaf,
          mute: state.mute,
          selfDeaf: state.selfDeaf,
          selfMute: state.selfMute,
          streaming: state.streaming,
          suppress: state.suppress,
        };
        node.send({ payload });
      };

      register('voiceStateUpdate', (oldState, newState) => {
        try {
          if (!oldState.channelId && newState.channelId) {
            sendState('join', newState);
          } else if (oldState.channelId && !newState.channelId) {
            sendState('leave', oldState);
          } else if (oldState.channelId !== newState.channelId) {
            sendState('leave', oldState);
            sendState('join', newState);
          } else {
            sendState('update', newState);
          }
        } catch (err) {
          node.error(err);
        }
      });

      node.status({ fill: 'green', shape: 'dot', text: 'listening' });

      node.on('close', () => {
        callbacks.forEach(({ event, listener }) => bot.removeListener(event, listener));
        discordBotManager.closeBot(bot);
      });
    }).catch(err => {
      node.error(err);
      node.status({ fill: 'red', shape: 'dot', text: err?.message || err });
    });
  }

  RED.nodes.registerType('discordVoiceState', discordVoiceState);
};
