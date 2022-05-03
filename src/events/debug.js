const SUPPRESSED_CODES = ['429'];

module.exports = (client, info) => {
    if (SUPPRESSED_CODES.some((code) => info.includes(code))) return;
    client.logger.debug(info);
};
