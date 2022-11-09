const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class MuteSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'mute-group',
            description: 'Mute Management - Set the mute role for users who are muted',
            type: client.types.ADMIN,
            userPermissions: ['MUTE_MEMBERS'],
            slashCommand: new SlashCommandBuilder().setName('muterole')
                .addSubcommand((o) => o.setName('set').setDescription('Set the mute role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the mute role. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the mute role')),
            subCommandMappings: {
                set: 'setmuterole',
                clear: 'clearmuterole',
            }
        });
    }
};
