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

const client = new Client(config, {
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    allowedMentions: {parse: ['users', 'roles'], repliedUser: true},
});

client.loadEvents('./src/events');
client.login(client.config.token).then(() => {
    client.loadCommands('./src/commands');
    client.loadTopics('./data/geoguessr', 'geoguessr');
    client.loadTopics('./data/trivia', 'trivia');
    client.handleMusicEvents();

    if (config.owners.length) {
        client.owners = config.owners.map(ownerId => client.users.fetch(ownerId).then(user => `<@${user.id}> ||${user.username}#${user.discriminator}||`));

        Promise.all(client.owners).then(owners => {
            client.owners = owners;
        });
    }
    if (config.managers.length) {
        client.managers = config.managers.map(managerId => client.users.fetch(managerId).then(user => `<@${user.id}> ||${user.username}#${user.discriminator}||`));

        Promise.all(client.managers).then(owners => {
            client.managers = owners;
        });
    }

    if (config.webserver.enabled) {
        new Webserver(client);
    }
    else {
        console.log('Skipped WebServer creation. Set "useWebServer" to true in config.json to enable it.');
        if (config.apiKeys.topGG.useMode === 'webhook_mode') {
            throw('"topGG.useMode" mode is set to webhook mode, but "webserver.enabled" is set to false. Consider setting "topGG.useMode" to "api_mode" or setting "webserver.enabled" to true.');
        }

    }
}).catch(err => {
    console.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    client.logger.error(err);
    console.log(err);
});
