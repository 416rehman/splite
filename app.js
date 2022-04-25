//entry point
const Client = require('./src/Client.js');
require('./src/utils/prototypes').arrayProto(Array)

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
]
const client = new Client(require('./config.json'), {intents, partials: ['MESSAGE', 'CHANNEL', 'REACTION'], allowedMentions: { parse: ['users', 'roles'], repliedUser: true }});

// Handle music events
client.handleMusicEvents();

// Initialize client
function init() {
  client.loadEvents('./src/events');
  client.loadCommands('./src/commands');
  client.loadTopics('./data/geoguessr');
}

client.login(client.token).then(()=>{
  init();
})

process.on('unhandledRejection', err => {client.logger.error(err); console.log(err);});
