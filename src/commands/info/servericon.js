const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class ServerIconCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'servericon',
            aliases: ['icon', 'i', 'serveravatar', 'serverav'],
            usage: 'servericon',
            description: 'Displays the server\'s icon.',
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context) {
        const embed = new EmbedBuilder()
            .setTitle(`${context.guild.name}'s Icon`)
            .setImage(context.guild.iconURL({dynamic: true, size: 512}))
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const payload = {embeds: [embed]};
        this.sendReply(context, payload);
    }
};
