const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

const emojis = require('../../utils/emojis.json');
const {MessageButton} = require('discord.js');
const {MessageActionRow} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

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

    interact(interaction, args, author) {
        const points = this.client.db.users.selectPoints
            .pluck()
            .get(author.id, interaction.guild.id);

        this.handle(interaction.options.getNumber('amount'), points, interaction, author, interaction.guild);
    }

    run(message, args) {
        const points = this.client.db.users.selectPoints
            .pluck()
            .get(message.author.id, message.guild.id);

        let startingAmount = parseInt(args[0]);
        if (isNaN(startingAmount) === true || !startingAmount) {
            if (args[0] === 'all' || args[0] === 'max') startingAmount = Math.min(points, this.client.config.stats.jackpot.limit);
            else {
                this.done(null, message.channel.id);
                return this.sendErrorMessage(message, 0, 'Please provide a valid point count');
            }
        }
        this.handle(startingAmount, points, message, message.author, message.guild);
    }

    handle(startingAmount, points, context, author) {

        if (startingAmount < 0 || startingAmount > points) {
            this.done(null, context.channel.id);
            return context
                .reply(`${emojis.nep} Nope, you only have ${points} points ${emojis.point}`);
        }
        if (startingAmount > this.client.config.stats.jackpot.limit) startingAmount = this.client.config.stats.jackpot.limit;

        const row = new MessageActionRow();
        row.addComponents(new MessageButton()
            .setCustomId('match')
            .setLabel('Match the jackpot!')
            .setStyle('PRIMARY'));
        row.addComponents(new MessageButton()
            .setCustomId('10percent')
            .setLabel(`Raise ${parseInt(Math.ceil(startingAmount * 0.1))}`)
            .setStyle('SECONDARY'));
        row.addComponents(new MessageButton()
            .setCustomId('half')
            .setLabel(`Raise ${parseInt(Math.ceil(startingAmount * 0.5))}`)
            .setStyle('SECONDARY'));
        row.addComponents(new MessageButton()
            .setCustomId('all')
            .setLabel('Go all in!')
            .setStyle('DANGER'));
        const row2 = new MessageActionRow();
        row2.addComponents(new MessageButton()
            .setCustomId('2')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(startingAmount * 2, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle('SECONDARY'));
        row2.addComponents(new MessageButton()
            .setCustomId('4')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(startingAmount * 4, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle('SECONDARY'));
        row2.addComponents(new MessageButton()
            .setCustomId('8')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(startingAmount * 8, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle('SECONDARY'));
        row2.addComponents(new MessageButton()
            .setCustomId('16')
            .setLabel(`Raise ${parseInt(Math.ceil(Math.min(startingAmount * 16, this.client.config.stats.jackpot.limit)))} points`)
            .setStyle('SECONDARY'));

        const entries = {
            [author.id]: {
                amount: startingAmount,
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

        const embed = new MessageEmbed()
            .setTitle(`💰 Lottery - ${remainingEntries()} Entries Left 🤑`)
            .setDescription(`A new lotto has been started!\n\nThe jackpot is currently at **${calculateJackpot()}** ${emojis.point}.\n\nEnter your bet below!`)
            .addField(`${this.getUserIdentifier(author)} (100%)`, `${startingAmount} ${emojis.point}`)
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
            context.channel
                .send({
                    embeds: [embed],
                    components: [row, row2],
                })
                .then((msg) => {
                    const filter = (button) => !Object.keys(entries).includes(button.user.id);
                    const collector = msg.createMessageComponentCollector({
                        filter, componentType: 'BUTTON', time: 30000, dispose: true
                    });

                    collector.on('collect', (b) => {
                        if (entries.length >= 20) {
                            collector.stop();
                            return b.reply('The lottery is full! No more entries are allowed.');
                        }

                        const userPoints = this.client.db.users.selectPoints
                            .pluck()
                            .get(b.user.id, context.guild.id);

                        if (userPoints <= 0) {
                            return b.reply('You do not have enough points to enter the lottery.');
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
                            entryPoints = parseInt(Math.ceil(startingAmount * 0.1));
                            newTotal = totalPoints * entryPoints;
                        }
                        else if (b.customId === 'half' && userPoints >= totalPoints / 2) {
                            entryPoints = startingAmount / 2;
                            newTotal = totalPoints * entryPoints;
                        }
                        else {
                            const multiplier = parseInt(b.customId);
                            const value = parseInt(Math.ceil(startingAmount * multiplier));
                            if (userPoints >= value) {
                                entryPoints = startingAmount * multiplier;
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
                });
        }
        catch (e) {
            this.done(null, context.channel.id);
        }
    }
};
