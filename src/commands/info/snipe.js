const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class SnipeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'snipe',
            usage: 'snipe',
            aliases: ['s', 'sn', 'sniper'],
            description: 'Shows the most recently deleted message in the channel',
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context, isInteraction) {
        const snipedMSg = context.guild.snipes.get(context.channel.id);

        if (snipedMSg && !this.client.utils.isEmptyMessage(snipedMSg)) {
            const embed = new EmbedBuilder()
                .setDescription(`${snipedMSg.content ? snipedMSg.content : ''}`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setImage(
                    `${
                        snipedMSg.attachments.size > 0
                            ? snipedMSg.attachments.first().url
                            : ''
                    }`
                )
                .setTimestamp()
                .setAuthor({
                    name: this.getUserIdentifier(snipedMSg.author),
                    iconURL: this.getAvatarURL(snipedMSg.author),
                });

            const payload = {
                embeds: [embed],
                // iterate over the attachments values and add them to files, remove the first one
                files: snipedMSg.attachments.size > 1 ? [...snipedMSg.attachments.values()].slice(1).map(a => {
                    return {
                        attachment: a.url,
                        name: a.name
                    };
                }) : [],
            };

            if (isInteraction) await context.editReply(payload);
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
            let msg;
            if (isInteraction) msg = await context.editReply(payload);
            else msg = context.loadingMessage ? await context.loadingMessage.edit(payload) : await context.reply(payload);

            msg.edit({embeds: [embed]}).then((m) => {
                setTimeout(() => m.delete(), 5000);
            });
        }
    }
};
