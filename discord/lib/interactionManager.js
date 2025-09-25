const INTERACTION_TTL_MS = 5 * 60 * 1000; // five minutes

const interactions = new Map();

const scheduleEviction = (interactionId, ttl) => {
    const timeout = setTimeout(() => {
        interactions.delete(interactionId);
    }, ttl ?? INTERACTION_TTL_MS);

    if (typeof timeout.unref === 'function') {
        timeout.unref();
    }

    return timeout;
};

const registerInteraction = (interaction, ttl) => {
    if (!interaction || !interaction.id) {
        return;
    }

    const existing = interactions.get(interaction.id);
    if (existing && existing.timeout) {
        clearTimeout(existing.timeout);
    }

    const timeout = scheduleEviction(interaction.id, ttl);
    interactions.set(interaction.id, { interaction, timeout });
};

const getInteraction = (interactionId) => {
    const entry = interactions.get(interactionId);
    if (!entry) {
        return undefined;
    }

    if (entry.timeout) {
        clearTimeout(entry.timeout);
    }

    interactions.delete(interactionId);
    return entry.interaction;
};

module.exports = {
    registerInteraction,
    getInteraction
}
