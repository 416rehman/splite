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
            this.webserver.db.integrations.setTopGG.run(req.body.user, Date.now());
        }

        console.log(req.body.user ? `[TopGG] Received vote from ${req.body.user}` : '[TopGG] Vote Webhook triggered without user');

        return {
            status: 200,
            body: {
                message: req.body?.user ? 'Vote received from ' + req.body.user : 'No vote received',
            },
        };
    }
};
