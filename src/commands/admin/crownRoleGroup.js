const Command = require('../Command.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

const commandMappings = {
    set: 'setcrownrole',
    clear: 'clearcrownrole',
};

module.exports = class CrownSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'crownrole',
            description: 'The crown role is given to the most active member of the day, and removed from all other members',
            type: client.types.ADMIN,
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('set').setDescription('Set the crown role - To view current role, don\'t provide a role').addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to set as the crown role. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the crown role'))
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
