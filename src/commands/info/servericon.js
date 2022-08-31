const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

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

    handle(context, isInteraction) {
        const embed = new MessageEmbed()
            .setTitle(`${context.guild.name}'s Icon`)
            .setImage(context.guild.iconURL({dynamic: true, size: 512}))
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor('RANDOM');

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
