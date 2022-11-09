const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');


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
        await this.handle(args[0] || 6, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const sides = interaction.options.getInteger('sides') || 6;
        this.handle(sides, interaction, true);
    }

    handle(sides, context) {
        const n = Math.floor(Math.random() * sides + 1);
        if (!n || sides <= 0) {
            const payload = 'Invalid number of sides - must be greater than 0';
            return this.sendReply(context, payload);
        }
        const payload = {
            embeds: [new EmbedBuilder()
                .setTitle('🎲  Dice Roll  🎲')
                .setDescription(`${context.author}, you rolled a **${n}**!`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author, 'png'),
                })
                .setTimestamp()]
        };

        this.sendReply(context, payload);
    }
};
