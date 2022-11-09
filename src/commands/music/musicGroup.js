const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class MusicCommandGroup extends Command {
    constructor(client) {

        super(client, {
            name: 'music-group',
            description: 'Music / DJ commands',
            type: client.types.MUSIC,
            voiceChannelOnly: true,
            slashCommand: new SlashCommandBuilder().setName('music')
                .setDescription('Music commands')
                .addSubcommand((o) => o.setName('play').setDescription('Play / Resume the music')
                    .addStringOption((o) => o.setName('query').setDescription('Query or URL to play'))
                )
                .addSubcommand((o) => o.setName('pause').setDescription('Pause the music'))
                .addSubcommand((o) => o.setName('stop').setDescription('Stop the music - Clears the queue'))
                .addSubcommand((o) => o.setName('previous').setDescription('Go back to the previous track'))
                .addSubcommand((o) => o.setName('skip').setDescription('Skip the current track'))
                .addSubcommand((o) => o.setName('loop').setDescription('Toggle looping the track or queue')
                    .addBooleanOption((o) => o.setName('queue').setDescription('Toggle looping the entire queue'))
                )
                .addSubcommandGroup((o) => o.setName('queue').setDescription('Queue management commands')
                    .addSubcommand((o) => o.setName('view').setDescription('View the current queue'))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the queue'))
                    .addSubcommand((o) => o.setName('shuffle').setDescription('Shuffle the queue'))
                )
                .addSubcommand((o) => o.setName('seek').setDescription('Seek to a specific time')
                    .addStringOption((o) => o.setName('time').setDescription('Time to seek to. i.e. 25s, 1m, 88s, etc.'))
                )
                .addSubcommand((o) => o.setName('search').setDescription('Search for a song')
                    .addStringOption((o) => o.setName('query').setDescription('Query to search for'))
                )
                .addSubcommand((o) => o.setName('progress').setDescription('View the progress of the current track'))
                .addSubcommand((o) => o.setName('nowplaying').setDescription('View the currently playing track')),
            subCommandMappings: {
                previous: 'back',
                filter: 'filter',
                nowplaying: 'nowplaying',
                pause: 'pause',
                play: 'play',
                progress: 'progress',
                queue: {
                    view: 'queue',
                    shuffle: 'shuffle',
                    clear: 'clear',
                },
                loop: 'loop',
                search: 'search',
                seek: 'seek',
                skip: 'skip',
                stop: 'stop',
            }
        });
    }

    interact(interaction) {
        let commandName = interaction.options.data.some(o => o.type === 'SUB_COMMAND_GROUP') ?
            this.subCommandMappings[interaction.options.getSubcommandGroup()][interaction.options.getSubcommand()] :
            this.subCommandMappings[interaction.options.getSubcommand()];

        const command = this.client.commands.get(commandName);

        if (command) command.interact(interaction);
        else interaction.reply('Invalid command - Potential mapping error');
    }
};
