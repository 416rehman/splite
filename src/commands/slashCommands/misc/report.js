const {SlashCommandBuilder} = require('@discordjs/builders');
const Command = require('../../Command.js');

module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'report',
            usage: 'report',
            description: 'report a ToS-breaking or hateful confession',
            type: client.types.INFO,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            ownerOnly: false,
            cooldown: 5,
            slashCommand: new SlashCommandBuilder()
                .addIntegerOption(option => option.setName('id').setDescription('ID of the confession').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription(`The reason for the report`))
        });
    }

    async run(interaction, args) {
        const reportsChannel = interaction.client.channels.cache.get(interaction.client.config.confessionReportsID)
        if (reportsChannel) reportsChannel.send(`${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id}) has reported Confession ID ${args[0].value}\n**Reason**\n||*${args[1]?.value || 'None'}*||`)
        return interaction.reply({content: `Your report has been received! Thank you`, ephemeral: true})
    }
}
