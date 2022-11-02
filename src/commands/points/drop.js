const Command = require('../Command.js');
const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'drop',
            aliases: ['droppoints', 'throw', 'throwpoints'],
            usage: 'drop <amount>',
            description: 'Drops points from your account that can be picked by others.',
            type: client.types.POINTS,
            examples: ['drop', 'drop 10'],
            slashCommand: new SlashCommandBuilder().addNumberOption((option) =>
                option
                    .setRequired(true)
                    .setName('amount')
                    .setDescription('The amount of points you want to drop.'))
        });
    }

    interact(interaction) {
        const amount = parseInt(interaction.options.getNumber('amount'));
        this.handle(amount, interaction.author, interaction, true);
    }

    run(message, args) {
        let amount = args && parseInt(args[0]);
        this.handle(amount, message.author, message, false);
    }

    handle(amount, user, context, isInteraction) {
        let bal = this.client.db.users.selectPoints
            .pluck()
            .get(user.id, context.guild.id);
        if (!bal) {
            return context.reply('You don\'t have any points.');
        }
        if (isNaN(amount)) {
            return context.reply('You need to specify an amount.');
        }

        if (amount > bal) {
            return context.reply('You don\'t have enough points to drop.');
        }
        if (amount < 5) {
            return context.reply('You can\'t drop less than 5 points.');
        }

        this.client.db.users.updatePoints.run({points: -amount}, user.id, context.guild.id);

        const guess1 = this.client.utils.getRandomInt(amount / 2, amount * 2, [amount]);
        const guess2 = this.client.utils.getRandomInt(amount / 2, amount * 2, [amount, guess1]);

        const randomizedGuesses = [
            new ButtonBuilder()
                .setCustomId(`${amount}`)
                .setLabel(`${amount} points`)
                .setEmoji(emojis.point)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('false1')
                .setLabel(`${guess1} points`)
                .setEmoji(emojis.point)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('false2')
                .setLabel(`${guess2} points`)
                .setEmoji(emojis.point)
                .setStyle(ButtonStyle.Secondary),
        ];

        // shuffle the buttons
        randomizedGuesses.sort(() => Math.random() - 0.5);

        const buttonRow = new ActionRowBuilder();
        randomizedGuesses.forEach(button => buttonRow.addComponents(button));

        const embed = new EmbedBuilder()
            .setTitle(`${emojis.point} Points Dropped!`)
            .setDescription('Guess the correct amount of points to pick them up.')
            .setFooter({
                text: this.getUserIdentifier(user),
                iconURL: this.getAvatarURL(user),
            });

        context.channel.send({
            embeds: [embed],
            components: [buttonRow]
        }).then(msg => {
            const collector = msg.createMessageComponentCollector({
                // filter: btn => btn.user.id !== user.id,
                componentType: ComponentType.Button,
                time: 30000,
                dispose: true,
            });

            collector.on('collect', btn => {
                if (btn.user.id === user.id) return btn.reply({
                    content: 'You can\'t pick up your own points.',
                    ephemeral: true
                });

                if (btn.customId === `${amount}`) {
                    collector.stop('claimed');
                    this.client.db.users.updatePoints.run({points: amount}, user.id, context.guild.id);
                    msg.edit({
                        embeds: [embed.setDescription(`${this.getUserIdentifier(btn.user)} picked up the ${amount} points!`)],
                        components: []
                    });
                    btn.reply({
                        content: `${emojis.success} You got ${amount} points!`,
                        ephemeral: true,
                    });
                }
                else {
                    btn.reply({
                        content: `${emojis.fail} You didn't guess the correct amount of points.`,
                        ephemeral: true,
                    });
                }

            });
            // delete the user command invokation
            if (!isInteraction) {
                context.delete();
            }
        });


    }
};
