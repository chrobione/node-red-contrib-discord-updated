module.exports = function (RED) {
    var discordBotManager = require('./lib/discordBotManager.js');

    const clientsByToken = new Map();
    const TTL_MS = 5 * 60 * 1000;

    const createTimeout = (token, onDrop) => {
        const timeout = setTimeout(() => {
            clientsByToken.delete(token);
            if (typeof onDrop === 'function') {
                try {
                    onDrop();
                } catch (err) {
                    // Swallow — callers should not rely on drop side effects throwing.
                }
            }
        }, TTL_MS);
        if (typeof timeout.unref === 'function') {
            timeout.unref();
        }
        return timeout;
    };

    const putClient = (token, client, onDrop) => {
        const entry = clientsByToken.get(token);
        if (entry?.timeout) {
            clearTimeout(entry.timeout);
        }
        const timeout = createTimeout(token, onDrop);
        clientsByToken.set(token, { client, timeout, onDrop });
    };

    const getClient = (token) => {
        const entry = clientsByToken.get(token);
        if (!entry) {
            return undefined;
        }
        if (entry.timeout) {
            clearTimeout(entry.timeout);
            entry.timeout = createTimeout(token, entry.onDrop);
        }
        return entry.client;
    };

    const dropClient = (token) => {
        const entry = clientsByToken.get(token);
        if (!entry) {
            return;
        }
        if (entry.timeout) {
            clearTimeout(entry.timeout);
        }
        clientsByToken.delete(token);
        if (typeof entry.onDrop === 'function') {
            try {
                entry.onDrop();
            } catch (err) {
                // Swallow — callers should not rely on drop side effects throwing.
            }
        }
    };

    function discordClient(config) {
        RED.nodes.createNode(this, config);
        const configNode = RED.nodes.getNode(config.token);
        const node = this;
        let activeBot;
        const activeTokens = new Set();
        discordBotManager.getBot(configNode).then(function(bot){
            activeBot = bot;
            node.status({ fill: "green", shape: "dot", text: "Ready" });
            node.on('input', function(msg, send, done) {
                send = send || node.send.bind(node);
                done = done || function (err) { if (err) { node.error(err, msg); } };
                try {
                    if (!msg || !msg._msgid) {
                        throw new Error('msg._msgid missing; cannot attach discord client deterministically.');
                    }

                    if (Object.prototype.hasOwnProperty.call(msg, 'discord') && msg.discord) {
                        throw new Error('msg.discord already set; refusing to overwrite existing client reference.');
                    }

                    const token = `${msg._msgid}:${node.id}`;
                    activeTokens.add(token);
                    putClient(token, bot, () => activeTokens.delete(token));

                    Object.defineProperty(msg, 'discord', {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: {
                            token,
                            get: () => getClient(token),
                            drop: () => dropClient(token),
                        },
                    });

                    Object.defineProperty(msg, 'discordClient', {
                        enumerable: false,
                        configurable: false,
                        get: () => getClient(token),
                    });

                    Object.defineProperty(msg, 'discordClientToken', {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: token,
                    });

                    send(msg);
                    done();

                } catch (error) {
                    node.status({ fill: "red", shape: "dot", text: error && error.message ? error.message : 'Failed to attach client' });
                    node.error(error, msg);
                    done(error);
                }
            });

            node.on('close', function(removed, done) {
                try {
                    activeTokens.forEach((token) => {
                        dropClient(token);
                        activeTokens.delete(token);
                    });
                    if (activeBot) {
                        discordBotManager.closeBot(activeBot);
                        activeBot = null;
                    }
                } finally {
                    if (typeof done === 'function') {
                        done();
                    }
                }
            });
        }).catch(err => {
            node.error(err);
            node.status({
                fill: "red",
                shape: "dot",
                text: err && err.message ? err.message : err
            });
        });

        node.context().set('discordClient:get', getClient);
        node.context().set('discordClient:drop', dropClient);
    }
    RED.nodes.registerType("discordClient", discordClient);
};
