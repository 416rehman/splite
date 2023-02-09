const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class PrefixSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix-group',
            description: 'Bot prefix management',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('prefix')
                .addSubcommand((o) => o.setName('set').setDescription('Set the prefix for the bot').addStringOption(p => p.setName('prefix').setRequired(true).setDescription('The prefix to set')))
                .addSubcommand((o) => o.setName('view').setDescription('View the current prefix')),
            subCommandMappings: {
                set: 'setprefix',
                view: 'prefix',
            }
        });
    }
};
