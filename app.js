//entry point
const Client = require('./src/Client.js');
require('./src/utils/prototypes').arrayProto(Array)
const config = require('./config.json');

global.__basedir = __dirname;

// check node version
if (process.version.slice(1).split('.')[0] < 16) {
    console.error('Node.js 16.0.0 or higher is required. Update Node.js on your system.');
    process.exit(1);
}

// Client setup
const intents = [
    "GUILDS",
    "GUILD_BANS",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "GUILD_MEMBERS",
    // "GUILD_PRESENCES"
];

const client = new Client(config, {
    intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    allowedMentions: {parse: ['users', 'roles'], repliedUser: true}
});

client.loadEvents('./src/events');

function createWebhookServer(client) {

    return server;
}

client.login(client.token).then(() => {
    client.loadCommands('./src/commands');
    client.loadTopics('./data/geoguessr');
    client.handleMusicEvents();

    if (config.useWebhookServer){
        // Load all webhook events
        client.loadWebhooks('./src/webhooks');

        const PORT = 8080;
        const http = require('http');
        const server = http.createServer((req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'});
        });

        // create a route for the webhook
        server.on('request', (req, res) => {
            if (req.method === 'POST') {
                const endpoint = req.url.split('/')[1];
                if (client.webhooks.has(endpoint)) {
                    const webhook = client.webhooks.get(endpoint);
                    webhook.validate(req, res);
                    webhook.handle(req, res);
                } else {
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.end('404 Not Found');
                }
            }
        });

        server.listen(PORT, () => {
            console.log(`Webhook server listening @ http://localhost:${PORT}`);
        });

    }
})

process.on('unhandledRejection', err => {
    client.logger.error(err);
    console.log(err);
});

