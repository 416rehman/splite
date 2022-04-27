const Webhook = require('./Webhook');
module.exports = class TopGGWebhook extends Webhook {
    constructor(client) {
        super(client, {
            name: 'topgg',
            description: 'Receives TopGG vote events.',
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
