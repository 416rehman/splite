const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class CrownSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'crownrole-group',
            description: 'The crown role is given to the most active member of the day, and removed from all other members',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('crownrole')
                .addSubcommand((o) => o.setName('set').setDescription('Set the crown role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the crown role. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the crown role')),
            subCommandMappings: {
                set: 'setcrownrole',
                clear: 'clearcrownrole',
            }
        });
    }
};
