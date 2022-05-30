const Endpoint = require('../Endpoint');

module.exports = class TopGGVoteEndpoint extends Endpoint {
    constructor(webserver) {
        super(webserver, {
            description: 'Receives TopGG vote events.',
            authorization: webserver.config.apiKeys.topGG.webhook_mode.authorization,
            disabled: webserver.config.apiKeys.topGG.useMode !== 'webhook_mode',
            method: 'POST',
        });
    }

    // eslint-disable-next-line no-unused-vars
    post(req, res) {
        if (req.body?.user) {
            console.log(`[TopGG] Received vote from ${req.body.user}`);
            this.webserver.db.integrations.setTopGG.run(req.body.user, Date.now());
        }
    }
};
