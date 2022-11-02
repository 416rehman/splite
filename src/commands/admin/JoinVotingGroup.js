const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

const commandMappings = {
    configure: 'setjoinvoting',
    clear: 'clearjoinvoting',
};

module.exports = class JoinVotingSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'joinvoting-settings',
            description: 'Join Vote management - New members will be subject to a vote to join the server',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            slashCommand: new SlashCommandBuilder().setName('joinvoting')
                .addSubcommand((o) => o.setName('configure').setDescription('Configure the join voting settings')
                    .addStringOption(p => p.setName('message-id').setRequired(false).setDescription('ID of the message which the user must react to to join the server'))
                    .addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to send the message to. To view current channel, don\'t provide this option'))
                    .addStringOption(p => p.setName('emoji').setRequired(false).setDescription('The emoji to use for the vote. To view current emoji, don\'t provide this option')))
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
