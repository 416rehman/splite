const {intents} = require('./src/utils/constants.json');

const enabledIntents = [
    intents.GUILDS,
    intents.GUILD_BANS,
    intents.GUILD_VOICE_STATES,
    intents.GUILD_MESSAGES,
    intents.GUILD_MESSAGE_REACTIONS,
    intents.GUILD_MEMBERS,
    intents.GUILD_PRESENCES,
];

module.exports = {
    allIntents: intents,
    enabledIntents,
};
