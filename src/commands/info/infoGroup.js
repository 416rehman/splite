const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');


module.exports = class InfoCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'info-group',
            description: 'Info commands for channels, roles, server and bot.',
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder().setName('info')
                .addSubcommand((o) => o.setName('channel').setDescription('Shows info about a channel.')
                    .addChannelOption((o) => o.setRequired(false).setName('channel').setDescription('The channel to show info about. Current channel if not specified.'))
                )
                .addSubcommand((o) => o.setName('role').setDescription('Shows info about a role.')
                    .addRoleOption((o) => o.setRequired(true).setName('role').setDescription('The role to show info about.'))
                )
                .addSubcommand((o) => o.setName('server').setDescription('Shows info about the server.'))
                .addSubcommand((o) => o.setName('bot').setDescription('Shows info/stats about this bot.')),
            subCommandMappings: {
                channel: 'channelinfo',
                role: 'roleinfo',
                server: 'serverinfo',
                bot: 'botinfo'
            }
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(this.subCommandMappings[interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command - Potential mapping error');
        }
    }
};
