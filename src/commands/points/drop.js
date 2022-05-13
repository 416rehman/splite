const Command = require('../Command.js');
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

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

    interact(interaction, args, author) {
        const amount = parseInt(interaction.options.getNumber('amount'));
        interaction.reply({
            content: `Dropping ${amount} points...`,
            ephemeral: true
        });
        this.handle(amount, author, interaction, true);
    }

    run(message, args) {
        let amount = args && parseInt(args[0]);
        this.handle(amount, message.author, message);
    }

    handle(amount, user, context) {
        let bal = this.client.db.users.selectPoints
            .pluck()
            .get(user.id, context.guild.id);
        if (!bal) {
            return context.reply('You don\'t have any points.');
        }
        if (isNaN(amount)) {
            console.log('Amount is not a number.', amount);
            return context.reply('You need to specify an amount.');
        }

        if (amount > bal) {
            console.log(`${user.tag} tried to drop ${amount} points, but only has ${bal} points.`);
            return context.reply('You don\'t have enough points to drop.');
        }
        if (amount < 5) {
            return context.reply('You can\'t drop less than 5 points.');
        }

        this.client.db.users.updatePoints.run({points: -amount}, user.id, context.guild.id);

        const guess1 = this.client.utils.getRandomInt(amount / 2, amount * 2, [amount]);
        const guess2 = this.client.utils.getRandomInt(amount / 2, amount * 2, [amount, guess1]);

        const randomizedGuesses = [
            new MessageButton()
                .setCustomId(`${amount}`)
                .setLabel(`${amount} points`)
                .setEmoji(emojis.point)
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('false1')
                .setLabel(`${guess1} points`)
                .setEmoji(emojis.point)
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('false2')
                .setLabel(`${guess2} points`)
                .setEmoji(emojis.point)
                .setStyle('SECONDARY'),
        ];

        // shuffle the buttons
        randomizedGuesses.sort(() => Math.random() - 0.5);

        const buttonRow = new MessageActionRow();
        randomizedGuesses.forEach(button => buttonRow.addComponents(button));

        const embed = new MessageEmbed()
            .setTitle(`${emojis.point} Points Dropped!`)
            .setDescription('Guess the correct amount of points to pick them up.');

        context.channel.send({
            embeds: [embed],
            components: [buttonRow]
        }).then(msg => {
            const collector = msg.createMessageComponentCollector({
                // filter: btn => btn.user.id !== user.id,
                componentType: 'BUTTON',
                time: 30000,
                dispose: true,
            });

            collector.on('collect', btn => {
                // if (btn.user.id === user.id) return btn.reply({
                //     content: 'You can\'t pick up your own points.',
                //     ephemeral: true
                // });

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
        });


    }
};
