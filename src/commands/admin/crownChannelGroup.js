const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class CrownChannelCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'crownchannel-group',
            description: 'The crown channel is where the winner of the day will be announced',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((o) => o.setName('set').setDescription('Set the crown channel - To view current channel, don\'t provide a channel').addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to set as the crown channel. To view current channel, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the crown channel')),
            subCommandMappings: {
                set: 'setcrownchannel',
                clear: 'clearcrownchannel',
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
