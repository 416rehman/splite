//entry point
const Client = require('./src/Client.js');
require('./src/utils/prototypes').arrayProto(Array);
const config = require('./config.json');
const Webserver = require('./src/Webserver.js');

global.__basedir = __dirname;

// check node version
if (process.version.slice(1).split('.')[0] < 16) {
    console.error('Node.js 16.0.0 or higher is required. Update Node.js on your system.');
    process.exit(1);
}

// Client setup
const intents = ['GUILDS', 'GUILD_BANS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS', // "GUILD_PRESENCES"
];

const client = new Client(config, {
    intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    allowedMentions: {parse: ['users', 'roles'], repliedUser: true},
});

client.loadEvents('./src/events');
client.login(client.token).then(() => {
    client.loadCommands('./src/commands');
    client.loadTopics('./data/geoguessr');
    client.handleMusicEvents();

    if (config.webserver.enabled) {
        new Webserver(client);
    }
    else {
        console.log('Skipped WebServer creation. Set "useWebServer" to true in config.json to enable it.');
        if (config.apiKeys.topGG.useMode === 'webhook_mode') {
            throw('"topGG.useMode" mode is set to webhook mode, but "webserver.enabled" is set to false. Consider setting "topGG.useMode" to "api_mode" or setting "webserver.enabled" to true.');
        }

    }
});

process.on('unhandledRejection', (err) => {
    client.logger.error(err);
    console.log(err);
});
