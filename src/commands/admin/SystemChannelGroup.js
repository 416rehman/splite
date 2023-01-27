const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class SystemChannelSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'system-group',
            description: `System Channel Management - System Channel is the channel where messages from the ${client.config.botName} developers will be sent`,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('system')
                .addSubcommandGroup((o) => o.setName('channel').setDescription('The system channel is where messages from the bot developers will be sent')
                    .addSubcommand((o) => o.setName('set').setDescription('Set the system channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the system channel. To view current channel, don\'t provide this option')))
                    .addSubcommand((o) => o.setName('clear').setDescription('Clear the system channel'))
                ),
            subCommandMappings: {
                channel: {
                    set: 'setsystemchannel',
                    clear: 'clearsystemchannel',
                }
            }
        });
    }
};
