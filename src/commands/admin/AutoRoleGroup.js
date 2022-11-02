const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

const commandMappings = {
    set: 'setautorole',
    clear: 'clearautorole',
};

module.exports = class AutoRoleSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'autorole-settings',
            description: 'Auto Role management - the auto role is a role that is automatically assigned to a user when they join the server',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('autorole')
                .addSubcommand((o) => o.setName('set').setDescription('Set the auto role - To view current role, don\'t provide a role')
                    .addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to give users when they join. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the current admin role'))
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(commandMappings[interaction.options.getSubcommand()]);
        if (command) {
            command.interact(interaction);
        }
        else {
            interaction.reply({
                content: 'Invalid command - Potential mapping error',
                ephemeral: true,
            });
        }
    }
};
