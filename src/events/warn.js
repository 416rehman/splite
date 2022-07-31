module.exports = (client, info) => {
    console.warn('[WARN EVENT]');
    client.logger.warn(info);
};
