const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class CoinFlipCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'coinflip',
            aliases: ['cointoss', 'coin', 'flip'],
            usage: 'coinflip',
            description: 'Flips a coin.',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder()
        });
    }

    async run(message) {
        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        try {
            const n = Math.floor(Math.random() * 2);
            let result;
            if (n === 1) result = 'heads';
            else result = 'tails';
            const embed = new EmbedBuilder()
                .setTitle('½  Coinflip  ½')
                .setDescription(
                    `I flipped a coin for you, <@${context.author.id}>! It was **${result}**!`
                )
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();

            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed],
                }) : context.channel.send({
                    embeds: [embed],
                });
            }
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed]
                }) : context.channel.send({
                    embeds: [embed]
                });
            }
        }
    }
};
