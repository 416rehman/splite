const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class AdminRoleSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'adminrole-group',
            description: 'Admin Role management - The admin role is used to determine who can use admin commands',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('adminrole')
                .addSubcommand((o) => o.setName('set').setDescription('Set the admin role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the crown role. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the current admin role')),
            subCommandMappings: {
                set: 'setadminrole',
                clear: 'clearadminrole',
            },
        });
    }
};
