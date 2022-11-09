const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class RoleCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'role-group',
            description: 'Role management commands - Create, Give, Info',
            type: client.types.MOD,
            userPermissions: ['MANAGE_ROLES'],
            slashCommand: new SlashCommandBuilder().setName('role')
                .addSubcommand((o) => o.setName('create').setDescription('Create a role')
                    .addStringOption(name => name.setName('name').setDescription('The name of the role').setRequired(true))
                )
                .addSubcommand((o) => o.setName('give').setDescription('Give a role to a user')
                    .addUserOption(user => user.setName('user').setDescription('The user to give the role to').setRequired(true))
                    .addRoleOption(role => role.setName('role').setDescription('The role to give to the user').setRequired(true))
                )
                .addSubcommand((o) => o.setName('info').setDescription('Get info about a role')
                    .addRoleOption(role => role.setName('role').setDescription('The role to get info about').setRequired(true))
                ),
            subCommandMappings: {
                create: 'addrole',
                give: 'giverole',
                info: 'roleinfo'
            }
        });
    }
};
