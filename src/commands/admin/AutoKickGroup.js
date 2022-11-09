const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class AutoKickSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'autokick-group',
            description: 'Auto Kick Settings - Auto kick users who surpass a certain number of warnings',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('autokick')
                .addSubcommand((o) => o.setName('set').setDescription('Set the auto kick threshold for a user - To view the current threshold, don\'t provide the amount')
                    .addIntegerOption(p => p.setName('amount').setRequired(false).setDescription('Amount of warnings - To view the current threshold, don\'t provide this')))
                .addSubcommand((o) => o.setName('disable').setDescription('Disables auto kick for a user')),
            subCommandMappings: {
                set: 'setautokick',
                disable: 'clearautokick',
            }
        });
    }

    interact(interaction) {
        const command = this.client.commands.get(this.subCommandMappings[interaction.options.getSubcommand()]);
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
