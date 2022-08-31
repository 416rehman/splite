const Command = require('../Command.js');
const Discord = require('discord.js');
const {parse} = require('twemoji-parser');
const _emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class AddEmojiCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'addemoji',
            aliases: ['add', 'em', 'emoji', 'emoji', 'addemote', 'ae'],
            usage: 'addemoji <emoji> <name>',
            description:
                'Add emoji from a server, or an image link.\nMultiple emojis can be added by typing all of them at once seperated by spaces.',
            type: client.types.MOD,
            clientPermissions: [
                'SEND_MESSAGES',
                'EMBED_LINKS',
                'MANAGE_EMOJIS_AND_STICKERS',
            ],
            userPermissions: ['MANAGE_ROLES'],
            examples: [
                'addemoji 🙄 feelsbad',
                'em https://i.imgur.com/iYU1mgQ.png coolEmoji',
                'em 😂 😙 😎',
            ],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(emoji => emoji.setName('emojis').setDescription('The emojis to add').setRequired(true))
                .addStringOption(name => name.setName('name').setDescription('The name of the emoji').setRequired(false))
        });
    }

    run(message, args) {
        if (!args[0] || args.length < 2) {
            return message.reply({embeds: [this.createHelpEmbed(message, 'Add Emoji', this)]});
        }

        this.handle(args, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        let emojis = interaction.options.getString('emojis');
        const name = interaction.options.getString('name');

        emojis = emojis.split(' ');
        const args = [...emojis];
        if (name) args.push(name);

        this.handle(args, interaction, true);
    }

    handle(args, context, isInteraction) {
        try {
            let emoji;
            if (args.length > 1) {
                const isSecondArgEmoji = /^(ftp|http|https):\/\/[^ "]+$/.test(args[1]) || Discord.Util.parseEmoji(args[1]).id;
                if (isSecondArgEmoji) {
                    args.forEach((emoji) => {
                        addEmoji.call(this, emoji, context, this, null, isInteraction);
                    });
                    return this.sendModLogMessage(context, null, {
                        Emoji: 'Multiple Emojis',
                    });
                }
                else { //second arg is not an emoji
                    emoji = addEmoji.call(this,
                        args[0],
                        context,
                        this,
                        args.slice(1).join('_'),
                        isInteraction
                    );
                }
            }
            else emoji = addEmoji.call(this, args[0], context, this, args.slice(1).join('_'), isInteraction);

            this.sendModLogMessage(context, null, {Emoji: emoji});
        }
        catch (err) {
            this.client.logger.error(err);
            this.sendReplyAndDelete(context, `${_emojis.fail} A error occured while adding the emoji. Common reasons are:- unallowed characters in emoji name, 50 emoji limit.`, isInteraction);
        }
    }
};

async function addEmoji(emoji, context, command, emojiName, isInteraction) {
    const urlRegex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/);
    if (!emoji) {
        this.sendReplyAndDelete(context, {embeds: [this.createErrorEmbed('Please provide a valid emoji.')]}, isInteraction);
    }

    let name;
    let customemoji = Discord.Util.parseEmoji(emoji); //Check if it's a emoji

    //If it's a custom emoji
    if (customemoji.id) {
        const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
            customemoji.animated ? 'gif' : 'png'
        }`;
        name = emojiName || customemoji.name;
        const emoji = await context.guild.emojis.create(`${Link}`, `${name}`);
        const payload = {
            embeds: [
                new Discord.MessageEmbed().setDescription(
                    `${_emojis.success} ${emoji} added with name "${name}"`
                ),
            ],
        };

        await this.sendReply(context, payload, isInteraction);

        return emoji;
    }
    else if (urlRegex.test(emoji)) { //Check if it's a link
        //check for image urls
        name = emojiName || Math.random().toString(36).slice(2); //make the name compatible or just choose a random string
        try {
            const addedEmoji = await context.guild.emojis.create(
                `${emoji}`,
                `${name || `${customemoji.name}`}`
            );
            const payload = {
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription(
                            `${addedEmoji} added with name "${addedEmoji.name}"`
                        )
                        .setFooter({
                            text: context.member.displayName,
                            iconURL: this.getAvatarURL(context.author),
                        }),
                ],
            };

            return this.sendReply(context, payload, isInteraction);
        }
        catch (e) {
            const payload = {
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription(
                            `${_emojis.fail} Failed to add emoji\n\`\`\`${e.message}\`\`\``
                        )
                        .setFooter({
                            text: context.member.displayName,
                            iconURL: this.getAvatarURL(context.author),
                        }),
                ],
            };

            return this.sendReplyAndDelete(context, payload);
        }
    }
    else {
        let CheckEmoji = parse(emoji, {assetType: 'png'});
        if (!CheckEmoji[0])
            return this.sendReplyAndDelete(context, {embeds: [this.createErrorEmbed(`Please mention a valid emoji. ${emoji} is invalid`)]}, isInteraction);
    }
}
