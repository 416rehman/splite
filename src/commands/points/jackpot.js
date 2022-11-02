const Command = require('../Command.js');
const {EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class raffleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'lotto',
            aliases: ['jackpot', 'raffle', 'lottery', 'casino'],
            usage: 'pot <amount>',
            description: 'Start a public lottery, the more you raise, the higher your chances of winning.',
            type: client.types.POINTS,
            examples: ['pot 100'],
            channelExclusive: true,
            slashCommand: new SlashCommandBuilder().addNumberOption((option) =>
                option.setName('amount').setDescription('The amount of points you want to put in the pot.').setRequired(true))
        });
    }

    run(message, args) {
        let startingAmount = parseInt(args[0]);

        this.handle(startingAmount, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const amount = interaction.options.getNumber('amount');

        await this.handle(amount, interaction, true);
    }

    async handle(amount, context, isInteraction) {
        if (isNaN(amount) === true || !amount) {
            if (amount === 'all' || amount === 'max') amount = Math.min(amount, this.client.config.stats.jackpot.limit);
            else {
                this.done(null, context.channel.id);
                return this.sendReplyAndDelete(context, {embeds: [this.createErrorEmbed('Please provide a valid point count')]}, isInteraction);
            }
        }

        const points = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);

        if (amount < 0 || amount > points) {
            this.done(null, context.channel.id);
            return this.sendReplyAndDelete(context, `${emojis.nep} Nope, you only have ${points} points ${emojis.point}`, isInteraction);
        }
        if (amount > this.client.config.stats.jackpot.limit) amount = this.client.config.stats.jackpot.limit;

        const row = new ActionRowBuilder();
        row.addComponents(new ButtonBuilder()
            .setCustomId('match')
            .setLabel('Match the jackpot!')
            .setStyle(ButtonStyle.Primary));
        row.addComponents(new ButtonBuilder()
            .setCustomId('10percent')
            .setLabel(`Raise ${parseInt(Math.ceil(amount * 0.1))}`)
            .setStyle(ButtonStyle.Secondary));
        row.addComponents(new ButtonBuilder()
            .setCustomId('half')
            .setLabel(`Raise ${parseInt(Math.ceil(amount * 0.5))}`)
            .setStyle(ButtonStyle.Secondary));
        row.addComponents(new ButtonBuilder()
            .setCustomId('all')
            .setLabel('Go all in!')
            .setStyle(ButtonStyle.Danger));
        const row2 = new ActionRowBuilder();
        row2.addComponents(new ButtonBuilder()
            .setCustomId('2')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(amount * 2, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle(ButtonStyle.Secondary));
        row2.addComponents(new ButtonBuilder()
            .setCustomId('4')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(amount * 4, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle(ButtonStyle.Secondary));
        row2.addComponents(new ButtonBuilder()
            .setCustomId('8')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(amount * 8, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle(ButtonStyle.Secondary));
        row2.addComponents(new ButtonBuilder()
            .setCustomId('16')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(amount * 16, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle(ButtonStyle.Secondary));

        const entries = {
            [context.author.id]: {
                amount: amount,
                chance: 100,
            },
        };

        // Returns the total amount of points in the pot
        let calculateJackpot = () => {
            let total = 0;
            for (const entry of Object.values(entries)) {
                total += entry.amount;
            }
            return total;
        };

        let remainingEntries = () => {
            const currentLength = Object.keys(entries).length;

            return this.client.config.stats.jackpot.maxEntries - currentLength > 0 ? Math.min(this.client.config.stats.jackpot.maxEntries, 25) - currentLength : 0;
        };

        const embed = new EmbedBuilder()
            .setTitle(`💰 Lottery - ${remainingEntries()} Entries Left 🤑`)
            .setDescription(`A new lotto has been started!\n\nThe jackpot is currently at **${calculateJackpot()}** ${emojis.point}.\n\nEnter your bet below!`)
            .addFields([{name: `${this.getUserIdentifier(context.author)} (100%)`, value:  `${amount} ${emojis.point}`}])
            .setImage('https://media0.giphy.com/media/eTrYclI5fuEIzuTo3A/giphy.gif?cid=ecf05e47pxm8zd60eipj09wd4p3hshj9ph0xst824qb4lh89&rid=giphy.gif')
            .setFooter({
                text: 'Ends in 30 seconds'
            });


        const chanceOfWinning = (points, jackpot) => {
            return Math.round((points / jackpot) * 100);
        };

        // Sort entries so that the highest chance is first
        let generateFields = () => {
            const total = calculateJackpot();

            //update the chance of winning
            for (const entry of Object.values(entries)) {
                entry.chance = chanceOfWinning(entry.amount, total);
            }

            //sort the entries
            let sortedEntries = Object.entries(entries).sort((a, b) => {
                return b[1].chance - a[1].chance;
            });

            // format the entries
            return sortedEntries.map((entry) => {
                return {
                    name: `${this.getUserIdentifier(context.guild.members.cache.get(entry[0]))} (${entry[1].chance}%)`,
                    value: `${entry[1].amount} ${emojis.point}`,
                };
            });
        };

        // returns the key of the entry that won
        const calculateWinner = () => {
            const total = calculateJackpot();
            const winner = parseInt(Math.random() * total);
            let current = 0;
            for (const [key, entry] of Object.entries(entries)) {
                current += entry.amount;
                if (current >= winner) {
                    return key;
                }
            }
            return null;
        };


        try {
            // take points from user
            this.client.db.users.updatePoints.run({points: -amount}, context.author.id, context.guild.id);

            const msg = await this.sendReply(context, {
                embeds: [embed],
                components: [row, row2],
            }, isInteraction);

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button, time: 30000, dispose: true
            });

            collector.on('collect', (b) => {
                if (entries.length >= 20) {
                    collector.stop();
                    return b.reply({
                        content: `${emojis.fail} Full! No more entries are allowed.`,
                        ephemeral: true,
                    });
                }

                if (Object.keys(entries).includes(b.user.id)) {
                    return b.reply({
                        content: `${emojis.fail} You already entered!`,
                        ephemeral: true,
                    });
                }

                const userPoints = this.client.db.users.selectPoints
                    .pluck()
                    .get(b.user.id, context.guild.id);

                if (userPoints <= 0) {
                    return b.reply({
                        content: `${emojis.nep} You don't have any points to enter!`,
                        ephemeral: true
                    });
                }

                const totalPoints = calculateJackpot();
                const userString = this.getUserIdentifier(b.user);

                let entryPoints = 0;
                let newTotal = parseInt(totalPoints) + parseInt(entryPoints);

                if (b.customId === 'match') {
                    if (userPoints >= totalPoints) {
                        entryPoints = totalPoints;
                        newTotal = entryPoints * 2;
                    }
                }
                else if (b.customId === 'all') {
                    entryPoints = userPoints;
                    newTotal = entryPoints + totalPoints;
                }
                else if (b.customId === '10percent' && userPoints >= totalPoints * 0.1) {
                    entryPoints = parseInt(Math.ceil(amount * 0.1));
                    newTotal = totalPoints * entryPoints;
                }
                else if (b.customId === 'half' && userPoints >= totalPoints / 2) {
                    entryPoints = amount / 2;
                    newTotal = totalPoints * entryPoints;
                }
                else {
                    const multiplier = parseInt(b.customId);
                    const value = parseInt(Math.ceil(amount * multiplier));
                    if (userPoints >= value) {
                        entryPoints = amount * multiplier;
                        newTotal = entryPoints + totalPoints;
                    }
                }

                if (entryPoints > 0) {
                    const winChance = chanceOfWinning(entryPoints, newTotal);
                    entries[b.user.id] = {
                        amount: entryPoints,
                        chance: winChance
                    };
                    embed.fields = generateFields(entries);
                    generateFields(userString, entryPoints, newTotal);
                    embed.setDescription(`A lotto has been started!\n\nThe jackpot is currently at **${calculateJackpot()}** ${emojis.point}.\n\nEnter your bet below!`);
                    embed.setTitle(`💰 Lottery - ${remainingEntries()} Entries Left 🤑`);
                    msg.edit({
                        embeds: [embed],
                        components: [row, row2],
                    });

                    // take points from user
                    this.client.db.users.updatePoints.run({points: -entryPoints}, b.user.id, context.guild.id);

                    b.reply({
                        content: `${emojis.success} You have raised the jackpot by **${entryPoints}** ${emojis.point}! Your chance of winning is **${entries[b.user.id].chance}%**!`,
                        ephemeral: true,
                    });
                }
                else {
                    b.reply({
                        content: `${emojis.nep} You don't have enough points to raise the jackpot!`,
                        ephemeral: true,
                    });
                }
            });

            collector.on('end', () => {
                const winner = context.guild.members.cache.get(calculateWinner());
                this.done(null, context.channel.id);
                embed.setDescription(`Congratulations, ${winner}! You have won the jackpot of **${calculateJackpot()}** ${emojis.point}!`);
                embed.setTitle('Lotto has ended!');
                embed.setFooter({
                    text: 'Start a new one with \'lotto\' command',
                });
                embed.setImage('https://media4.giphy.com/media/aEe0CItDLk0XQnsk0L/giphy.gif?cid=ecf05e47d669fdlhtjxu53wlu9gx0ofct2ivkl7ba8vin3mh&rid=giphy.gif');
                // give points to winner
                this.client.db.users.updatePoints.run({points: calculateJackpot()}, winner.id, context.guild.id);
                msg.edit({
                    components: [],
                    embeds: [embed],
                });
            });
        }
        catch (e) {
            this.done(null, context.channel.id);
        }
    }
};
