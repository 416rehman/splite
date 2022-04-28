const Endpoint = require('../Endpoint');

module.exports = class TopGGWebhook extends Endpoint {
    constructor(client) {
        super(client, {
            description: 'Status of TopGG webhook',
            authorization: client.config.apiKeys.topGG.webhook_mode.authorization,
            requestsPerMinute: 60,
            cooldownTime: 1000,
            disabled: client.config.apiKeys.topGG.useMode !== 'webhook_mode'
        });
    }

    execute() {
        return {
            status: 200,
            body: {
                message: 'Received TopGG vote event.'
            }
        };
    }
};
