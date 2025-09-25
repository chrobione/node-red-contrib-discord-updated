module.exports = function (RED) {
    var discordBotManager = require('./lib/discordBotManager.js');
    const { clone } = require('./lib/json-utils.js');

    function discordActivity(config) {
        RED.nodes.createNode(this, config);
        var configNode = RED.nodes.getNode(config.token);
        var node = this;

        discordBotManager.getBot(configNode).then(function (bot) {
            node.on('input', async function (msg, send, done) {
                send = send || node.send.bind(node);
                done = done || function (err) { if (err) { node.error(err, msg); } };
                try {
                    const type = msg.type ?? (config.atype !== undefined ? Number(config.atype) : null);
                    const status = msg.status || config.astatus || 'online';
                    const url = msg.url || config.aurl || null;
                    const statusText = msg.text || config.atext || null;

                    await bot.user.setPresence({ activities: [{ name: statusText, type, url }], status });

                    msg.payload = {
                        status: bot.presence?.status,
                        activity: bot.presence?.activities ? clone(bot.presence.activities[0]) : null,
                    };

                    node.status({ fill: "green", shape: "dot", text: "Bot activities updated" });
                    send(msg);
                    done();
                } catch (error) {
                    const statusText = error && error.message ? error.message : 'Failed to set activity';
                    const errObj = error instanceof Error ? error : new Error(statusText);
                    node.status({ fill: "red", shape: "dot", text: statusText });
                    node.error(errObj, msg);
                    done(errObj);
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
    RED.nodes.registerType("discordActivity", discordActivity);
};
