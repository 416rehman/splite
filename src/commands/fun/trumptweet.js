const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {fail} = require('../../utils/emojis.json');

module.exports = class TrumpTweetCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'trumptweet',
            aliases: ['trump'],
            usage: 'trumptweet <message>',
            description:
                'Display\'s a custom tweet from Donald Trump with the message provided.',
            type: client.types.FUN,
            examples: [`trumptweet ${client.name} is the best Discord Bot!`],
        });
    }

    async run(message, args) {
        if (!args[0])
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a message to tweet'
            );
        let text = message.content.slice(
            message.content.indexOf(args[0]),
            message.content.length
        );

        await this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text') || `${this.client.name}  is the best bot!`;
        await this.handle(text, interaction, true);
    }

    async handle(text, context) {
        if (text.length > 68) text = text.slice(0, 65) + '...';

        try {
            const res = await fetch(
                'https://nekobot.xyz/api/imagegen?type=trumptweet&text=' + text
            );
            const img = (await res.json()).message;
            const embed = new EmbedBuilder()
                .setTitle(':flag_us:  Trump Tweet  :flag_us: ')
                .setImage(img)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                });

            const payload = {
                embeds: [embed],
            }; await this.sendReply(context, payload);

        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('Red');
            const payload = {
                embeds: [embed],
            }; await this.sendReply(context, payload);
        }
    }
};
