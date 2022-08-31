const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');
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
            const embed = new MessageEmbed()
                .setDescription(
                    `${snipedMSg.newMessage.author} edited [message](https://discord.com/channels/${context.guild.id}/${context.channel.id}/${snipedMSg.newMessage.id})`
                )
                .addField('Before', snipedMSg.oldMessage.content || '')
                .addField('After', snipedMSg.newMessage.content || '')
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
            const embed = new MessageEmbed()
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
