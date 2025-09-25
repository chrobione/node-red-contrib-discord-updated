module.exports = function(RED) {
    var discordBotManager = require('./lib/discordBotManager.js');

    function discordClient(config) {
        RED.nodes.createNode(this, config);
        var configNode = RED.nodes.getNode(config.token);
        var node = this;
        discordBotManager.getBot(configNode).then(function(bot){
            node.status({ fill: "green", shape: "dot", text: "Ready" });
            node.on('input', function(msg, send, done) {
                send = send || node.send.bind(node);
                done = done || function (err) { if (err) { node.error(err, msg); } };
                try {
                    msg.discord = bot;
                    send(msg);
                    done();
                } catch (error) {
                    node.status({ fill: "red", shape: "dot", text: error && error.message ? error.message : 'Failed to attach client' });
                    node.error(error, msg);
                    done(error);
                }
            });
            node.on('close', function() {
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
    RED.nodes.registerType("discordClient", discordClient);
};
