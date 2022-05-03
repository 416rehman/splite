const Endpoint = require('../Endpoint');

module.exports = class SampleWebhook extends Endpoint {
    constructor(webserver) {
        super(webserver, {
            description: 'This is a sample webhook', // Description of the endpoint
            rateLimit: {       // Rate limit info - Leave out to disable rate limiting
                rpm: 1,        // Requests per minute - 0 for unlimited
                cooldown: 60000 // Cooldown (in milliseconds) for the IP after reaching the rate limit - Leave out to disable cooldown
            },
            allowedIPs: ['192.168.0.1', '192.168.0.2'], // Array of IPs that are allowed to use this endpoint - Leave out to disable check
            authorization: 'ASDFAGASDGASDFASDFA', // Expects authorization header with this value to access this endpoint - Leave out to disable check
            disabled: false // Set to true to disable this endpoint - Leave out or set to false to disable check
        });
    }

    // eslint-disable-next-line no-unused-vars
    get(req, res) {
        return {
            status: 200,
            body: {
                message: 'This webhook is working!',
                hello: 'world'
            }
        };
    }

    // eslint-disable-next-line no-unused-vars
    post(req, res) {
        return {
            status: 200,
            body: {
                message: 'The body you sent is received!',
                someOtherField: 2 + 3,
                yetAnotherField: 'Hello World!'
            }
        };
    }
};
