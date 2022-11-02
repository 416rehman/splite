const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

const commandMappings = {
    create: 'addrole',
    give: 'giverole',
    info: 'roleinfo'
};

module.exports = class RoleCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'role',
            description: 'Role management commands - Create, Give, Info',
            type: client.types.MOD,
            userPermissions: ['MANAGE_ROLES'],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('create').setDescription('Create a role')
                    .addStringOption(name => name.setName('name').setDescription('The name of the role').setRequired(true))
                )
                .addSubcommand((o) => o.setName('give').setDescription('Give a role to a user')
                    .addUserOption(user => user.setName('user').setDescription('The user to give the role to').setRequired(true))
                    .addRoleOption(role => role.setName('role').setDescription('The role to give to the user').setRequired(true))
                )
                .addSubcommand((o) => o.setName('info').setDescription('Get info about a role')
                    .addRoleOption(role => role.setName('role').setDescription('The role to get info about').setRequired(true))
                )
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(commandMappings[interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply('Invalid command - Potential mapping error');
        }
    }
};
