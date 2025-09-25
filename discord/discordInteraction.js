const { clone } = require('./lib/json-utils.js');
module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  var discordInterationManager = require('./lib/interactionManager.js');

  function discordInteraction(config) {
    RED.nodes.createNode(this, config);
    var configNode = RED.nodes.getNode(config.token);
    var node = this;
    let interactionType = config.interactionType || "all";
    let custom_id = config.custom_id;    
    let injectInteractionObject = config.interactionObject || false;
    let ephemeral = config.ephemeral || false;
    let responseType = config.responseType || "update";
    let commandResponseType = config.commandResponseType || "defersReply";

    discordBotManager.getBot(configNode).then(function (bot) {
      var callbacks = [];
      node.status({
        fill: "green",
        shape: "dot",
        text: "ready"
      });

      const matchInteractionType = (interaction) => {
        switch (interactionType) {
          case "button":
            return interaction.isButton();
          case "selectMenu":
            return interaction.isStringSelectMenu();
          case "command":
            return interaction.isCommand();
          case "messageContextMenu":
            return interaction.isMessageContextMenuCommand();
          case "autoComplete":
            return interaction.isAutocomplete();
          case "modalSubmit":
              return interaction.isModalSubmit();
          case "all":
            return true;
          default:
            return false;
        }
      };

      var registerCallback = function (eventName, listener) {
        callbacks.push({
          'eventName': eventName,
          'listener': listener
        });
        bot.on(eventName, listener);
      }

      registerCallback("interactionCreate", async interaction => {
        try {
          if (!matchInteractionType(interaction)) return;
          discordInterationManager.registerInteraction(interaction);

          // -- Processing ways to handle interactions for each type --

          if (interaction.isCommand() || interaction.isMessageContextMenuCommand()) {    
            if (custom_id && custom_id.split(",").indexOf(interaction.commandName) < 0) return;            

            if(commandResponseType == "defersReply")
            {              
              await interaction.deferReply({ephemeral: ephemeral});
            }    
          }
          else if(interaction.isModalSubmit())
          {
            if (custom_id && custom_id.split(",").indexOf(interaction.customId) < 0) return;        
            
            await interaction.deferReply();
          }
          else if(interaction.isAutocomplete())
          {
            // nothing to do            
          }
          else {
            if (custom_id && custom_id.split(",").indexOf(interaction.customId) < 0) return;
              if(responseType == "update")
                await interaction.deferUpdate();
              else
                await interaction.deferReply();
          }


          // -- Building response for each type --

          let message = {};
          message.payload = clone(interaction);
          message.payload.user = clone(interaction.user);

          if(interaction.member !== null) {
            message.payload.member = clone(interaction.member);
            message.payload.member.guild = clone(interaction.member.guild);
          }
          else {
            message.payload.member = null;
          }

          if (injectInteractionObject)
            message.interactionObject = interaction;

          if (interaction.isCommand() || interaction.isMessageContextMenuCommand()) {
            message.payload.options = clone(interaction.options);            
          }
          else if(interaction.isAutocomplete())
          {
            // nothing to do
          }
          else if(interaction.isModalSubmit())
          {
            // nothing to do
          }
          else {            
            message.payload.message = clone(interaction.message);
            message.payload.message.author = clone(interaction.message.author);
          }

          node.send(message);
        } catch (error) {
          node.error(error);
          node.status({
            fill: "red",
            shape: "dot",
            text: error
          });
        }
      })

      registerCallback('error', err => {
        node.error(err);
        node.status({
          fill: "red",
          shape: "dot",
          text: err
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
        text: "wrong token?"
      });
    });
  }
  RED.nodes.registerType("discordInteraction", discordInteraction);
};
