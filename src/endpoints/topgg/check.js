const Endpoint = require('../Endpoint');

module.exports = class TopGGEndpoint extends Endpoint {
    constructor(client) {
        super(client, {
            description: 'Receives TopGG vote events.',
            authorization: client.config.apiKeys.topGG.webhook_mode.authorization,
            rateLimit: {
                rpm: 60, // 60 requests per minute
                cooldown: 60000 // 1 minute
            },
            disabled: client.config.apiKeys.topGG.useMode !== 'webhook_mode'
        });
    }

    execute(req) {
        console.log('TopGG vote event received.');
        console.log(req.body);

        return {
            status: 200,
            body: {
                message: 'TopGG vote event received.'
            }
        };
    }
};
