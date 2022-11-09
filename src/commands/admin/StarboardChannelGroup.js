const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class StarboardChannelSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'starboard-group',
            description: 'Starboard Management - Starboard is a feature that lets you post messages to a channel if they receive a 🌟 reaction',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],

            slashCommand: new SlashCommandBuilder().setName('starboard')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The starboard channel is where the starboard messages will be posted')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the starboard channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the starboard channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the starboard channel'))
                ),
            subCommandMappings: {
                channel: {
                    set: 'setstarboardchannel',
                    clear: 'clearstarboardchannel',
                }
            }
        });
    }
};
