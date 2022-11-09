const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

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
        await this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    async handle(context) {
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

            const payload = {
                embeds: [embed],
            };
            await this.sendReply(context, payload);
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
