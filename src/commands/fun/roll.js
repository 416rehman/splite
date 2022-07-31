const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {load} = require('../../utils/emojis.json');

module.exports = class RollCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'roll',
            aliases: ['dice', 'r'],
            usage: 'roll <dice sides>',
            description:
                'Rolls a dice with the specified number of sides. Will default to 6 sides if no number is given.',
            type: client.types.FUN,
            examples: ['roll 20'],
            slashCommand: new SlashCommandBuilder().addIntegerOption((i) => i.setName('sides').setRequired(false).setDescription('The number of sides on the dice'))
        });
    }

    async run(message, args) {
        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(args[0] || 6, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const sides = interaction.options.getInteger('sides') || 6;
        this.handle(sides, interaction, true);
    }

    handle(sides, context, isInteraction) {
        const n = Math.floor(Math.random() * sides + 1);
        if (!n || sides <= 0) {
            const payload = 'Invalid number of sides - must be greater than 0';
            if (isInteraction) return context.editReply(payload);
            return context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }
        const payload = {
            embeds: [new MessageEmbed()
                .setTitle('🎲  Dice Roll  🎲')
                .setDescription(`${context.author}, you rolled a **${n}**!`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author, 'png'),
                })
                .setTimestamp()]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
    }
};
