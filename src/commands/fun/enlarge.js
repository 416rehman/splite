const Command = require('../Command.js');
const Discord = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');
const {EmbedBuilder, parseEmoji} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class enlargeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'enlarge',
            aliases: [
                'en',
                'el',
                'big',
                'maximize',
                'bigemoji',
                'enemoji',
                'expand',
                'enhance',
            ],
            usage: 'en <emoji>',
            description: 'Enlarges a custom emoji',
            type: client.types.FUN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
            examples: ['enlarge 🙄'],
            slashCommand: new SlashCommandBuilder().addStringOption((s) => s.setName('emoji').setRequired(true).setDescription('The emoji to enlarge')),
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Enlarge Emoji', this)]});

        await this.handle(args[0], message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction.options.getString('emoji'), interaction);
    }

    async handle(text, context) {
        try {
            let customemoji = parseEmoji(text); //Check if it's a emoji

            if (customemoji.id) {
                const Link = `https://cdn.discordapp.com/emojis/${customemoji.id}.${
                    customemoji.animated ? 'gif' : 'png'
                }`;
                const payload = {
                    files: [new Discord.AttachmentBuilder(Link)],
                };
                this.sendReply(context, payload);
            }
            else {
                this.sendErrorMessage(
                    context,
                    0,
                    'Please mention a valid custom emoji.'
                );
            }
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('Red');
            const payload = {
                embeds: [embed]
            };
            await this.sendReply(context, payload);
        }
    }
};
