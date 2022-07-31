module.exports = (client, info) => {
    console.warn('[RATE LIMIT EVENT]');
    console.warn(info);
    client.logger.warn(info);
};
