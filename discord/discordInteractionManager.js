module.exports = function (RED) {
    var discordBotManager = require('./lib/discordBotManager.js');
    var discordInterationManager = require('./lib/interactionManager.js');
    var messagesFormatter = require('./lib/messagesFormatter.js');
    const { ModalBuilder } = require('discord.js');
    const { clone } = require('./lib/json-utils.js');

    const checkString = (field) => typeof field === 'string' ? field : false;

    function discordInteractionManager(config) {
        RED.nodes.createNode(this, config);
        var configNode = RED.nodes.getNode(config.token);
        var node = this;

        discordBotManager.getBot(configNode).then(function (bot) {
            node.on('input', async (msg, send, done) => {
                send = send || node.send.bind(node);
                done = done || function (err) { if (err) { node.error(err, msg); } };
                try {
                    const content = msg.payload?.content || checkString(msg.payload) || ' ';
                    const inputEmbeds = msg.payload?.embeds || msg.payload?.embed || msg.embeds || msg.embed;
                    const inputAttachments = msg.payload?.attachments || msg.payload?.attachment || msg.attachments || msg.attachment;
                   const inputComponents = msg.payload?.components || msg.components;
                   const interactionId = msg.interactionId;
                   const action = msg.action || 'edit';
                   const autoCompleteChoices = msg.autoCompleteChoices || [];
                   const customId = msg.customId;
                    const suppressEmbeds = msg.suppressEmbeds ?? msg.payload?.suppressEmbeds;
                    const suppressNotifications = msg.suppressNotifications ?? msg.payload?.suppressNotifications;
                    const ephemeral = msg.ephemeral ?? msg.payload?.ephemeral;

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

                    const buildFlags = (allowEphemeral = false) => {
                        const flags = [];
                        if (suppressEmbeds === true) {
                            flags.push('SuppressEmbeds');
                        }
                        if (suppressNotifications === true) {
                            flags.push('SuppressNotifications');
                        }
                        if (allowEphemeral && ephemeral === true) {
                            flags.push('Ephemeral');
                        }
                        return flags;
                    };

                    const createPayload = (allowEphemeral = false) => {
                        const payload = {
                            embeds: embeds,
                            content: content,
                            files: attachments,
                            components: components
                        };

                        const flags = buildFlags(allowEphemeral);
                        if (flags.length) {
                            payload.flags = flags;
                        }

                        if (allowEphemeral && ephemeral === true) {
                            payload.ephemeral = true;
                        }

                        return payload;
                    };

                    const requeueInteraction = () => {
                        // Keep the cached interaction alive for follow-up actions.
                        discordInterationManager.registerInteraction(interaction);
                    };

                    const editInteractionReply = async () => {
                        const payload = createPayload(false);
                        await interaction.editReply(payload);

                        const newMsg = {
                            interaction: clone(interaction)
                        };

                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} edited`, newMsg);
                    }

                    const replyInteraction = async () => {
                        const payload = createPayload(true);
                        await interaction.reply(payload);

                        const newMsg = {
                            interaction: clone(interaction)
                        };

                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} replied`, newMsg);
                    }

                    const followUpInteraction = async () => {
                        const payload = createPayload(true);
                        const message = await interaction.followUp(payload);

                        const newMsg = {
                            interaction: clone(interaction),
                            message: clone(message)
                        };

                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} followup sent`, newMsg);
                    }

                    const editFollowUpInteraction = async () => {
                        if (!followUpId) {
                            throw new Error('msg.messageId (or msg.message.id) is required to edit a follow-up message.');
                        }

                        const payload = createPayload(false);
                        const message = await interaction.editFollowUp(followUpId, payload);

                        const newMsg = {
                            interaction: clone(interaction),
                            message: clone(message)
                        };

                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} followup edited`, newMsg);
                    }

                    const deleteInteractionReply = async () => {
                        if (followUpId) {
                            await interaction.deleteFollowUp(followUpId);
                            requeueInteraction();
                            setSuccess(`interaction ${interactionId} followup deleted`, { deleted: true, messageId: followUpId });
                            return;
                        }

                        await interaction.deleteReply();
                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} reply deleted`, { deleted: true });
                    }

                    const showModal = async () => {
                        const modal = new ModalBuilder()
                            .setCustomId(customId || 'myModal')
                            .setTitle(content || 'Modal');
                        
                        modal.addComponents(components);                        
                        interaction.showModal(modal);

                        const newMsg = {
                            interaction: clone(interaction)
                        };

                        setSuccess(`interaction ${interactionId} modal showed`, newMsg);
                    }

                    const respondAutocomplete = async () => {
                        if (!interaction.isAutocomplete()) {
                            setError("Error: not autocomplete Interaction");
                            return;
                        }

                        const focusedValue = interaction.options.getFocused();
                        const filtered = autoCompleteChoices.filter(choice => choice.startsWith(focusedValue));

                        await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));

                        const newMsg = {
                            interaction: clone(interaction)
                        };


                        requeueInteraction();
                        setSuccess(`interaction ${interactionId} filtered`, newMsg);
                    }

                    let interaction = await discordInterationManager.getInteraction(interactionId);
                    if (!interaction) {
                        setError(`Could not find interaction '${interactionId}'. It may have expired.`);
                        return;
                    }

                    const followUpId = msg.messageId || msg.followupId || msg.message?.id || msg.payload?.messageId;

                    let attachments, embeds, components;
                    try {
                        attachments = messagesFormatter.formatAttachments(inputAttachments);
                        embeds = messagesFormatter.formatEmbeds(inputEmbeds);                        
                        components = inputComponents;
                    } catch (error) {
                        setError(error);
                        return;
                    }

                    switch (action.toLowerCase()) {
                        case 'reply':
                            await replyInteraction();
                            break;
                        case 'edit':
                            await editInteractionReply();
                            break;
                        case 'followup':
                            await followUpInteraction();
                            break;
                        case 'editfollowup':
                            await editFollowUpInteraction();
                            break;
                        case 'delete':
                            await deleteInteractionReply();
                            break;
                        case 'showmodal':
                            await showModal();
                            break;
                        case 'respondautocomplete':
                            await respondAutocomplete();
                            break;
                        default:
                            setError(`msg.action has an incorrect value`)
                    }


                } catch (error) {
                    const message = error && error.message ? error.message : 'Failed to process interaction';
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: message
                    });
                    node.error(error, msg);
                    done(error);
                }

            });

            node.on('close', function () {
                discordBotManager.closeBot(bot);
            });
        }).catch(err => {
            console.log(err);
            node.status({
                fill: "red",
                shape: "dot",
                text: err
            });
        });
    }

    RED.nodes.registerType("discordInteractionManager", discordInteractionManager);
};
