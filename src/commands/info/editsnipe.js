const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');
module.exports = class SnipeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'editsnipe',
            usage: 'editsnipe',
            aliases: ['es', 'esn', 'esniper'],
            description: 'Shows the most recently edited message in the channel',
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

        const snipedMSg = context.guild.editSnipes.get(context.channel.id);

        if (snipedMSg && snipedMSg.newMessage && snipedMSg.oldMessage.content) {
            const embed = new EmbedBuilder()
                .setDescription(
                    `${snipedMSg.newMessage.author} edited [message](https://discord.com/channels/${context.guild.id}/${context.channel.id}/${snipedMSg.newMessage.id})`
                )
                .addFields([{name: 'Before', value:  snipedMSg.oldMessage.content || ''}])
                .addFields([{name: 'After', value:  snipedMSg.newMessage.content || ''}])
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setImage(
                    `${
                        snipedMSg.newMessage.attachments.size > 0
                            ? snipedMSg.attachments.first().url
                            : ''
                    }`
                )
                .setTimestamp()
                .setAuthor({
                    name: `${snipedMSg.newMessage.author.username}#${snipedMSg.newMessage.author.discriminator}`,
                    iconURL: `https://cdn.discordapp.com/avatars/${snipedMSg.newMessage.author.id}/${snipedMSg.newMessage.author.avatar}.png`,
                });

            const payload = {embeds: [embed]};
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
        else {
            const embed = new EmbedBuilder()
                .setTitle(`${this.client.name} Sniper`)
                .setDescription(`${fail} There is nothing to snipe!`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();

            const payload = {embeds: [embed]};
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
    }
};
