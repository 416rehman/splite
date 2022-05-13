const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class gambleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'gamble',
            aliases: ['spin', 'heads', 'tails', 'roll'],
            usage: 'gamble <point count / "all">',
            description: 'Gamble your points.',
            type: client.types.POINTS,
            examples: ['gamble 1000'],
            exclusive: true,
        });
    }

    async run(message, args) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);

        let amount = parseInt(args[0]);
        const points = message.client.db.users.selectPoints
            .pluck()
            .get(message.author.id, message.guild.id);
        if (isNaN(amount) === true || !amount) {
            if (args[0] === 'all' || args[0] === 'max') amount = points;
            else {
                this.done(message.author.id);
                return this.sendErrorMessage(
                    message,
                    0,
                    'Please provide a valid point count'
                );
            }
        }

        if (amount < 0 || amount > points) {
            this.done(message.author.id);
            return message.reply(
                `${emojis.nep} Please provide an amount you currently have! You have **${points} points** ${emojis.point}`
            );
        }
        if (amount > this.client.config.stats.gambling.limit) {
            this.done(message.author.id);
            return message.reply(
                `${emojis.fail} You can't bet more than ${this.client.config.stats.gambling.limit} points ${emojis.point} at a time. Please try again!`
            );
        }

        const modifier = (await message.client.utils.checkTopGGVote(
            message.client,
            message.author.id
        ))
            ? this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds
            : 0;
        const embed = new MessageEmbed()
            .setTitle(
                `${modifier ? emojis.Voted : ''}${
                    message.author.username
                } gambling ${amount} points ${emojis.point}`
            )
            .setDescription(
                `${emojis.point} **Rolling** ${emojis.point}\n${emojis.dices}${emojis.dices}${emojis.dices}`
            )
            .setFooter({
                text: `Your points: ${points}.`,
                iconURL: message.author.displayAvatarURL({dynamic: true}),
            });

        message.channel
            .send({embeds: [embed]})
            .then((msg) => {
                setTimeout(() => {
                    let odds = message.client.odds.get(message.author.id) || {
                        win: this.client.config.stats.gambling.winOdds,
                        lose: 1 - this.client.config.stats.gambling.winOdds,
                    };
                    odds.win += modifier;
                    odds.lose -= modifier;

                    const outcome = message.client.utils.weightedRandom(odds);

                    //Loss
                    if (outcome === 'lose') {
                        const embed = new MessageEmbed()
                            .setTitle(
                                `${modifier ? emojis.Voted : ''}${
                                    message.author.username
                                } gambling ${amount} Points ${emojis.point}`
                            )
                            .setDescription(
                                `${emojis.fail} You lost! **You now have ${
                                    points - amount
                                }** ${emojis.point}\n\n${
                                    modifier
                                        ? ''
                                        : emojis.Voted +
                                        `Get a +10% boost to your odds: \`${prefix}vote\``
                                }`
                            )
                            .setFooter({
                                text: `Your points: ${points - amount}.`,
                                iconURL: message.author.displayAvatarURL({
                                    dynamic: true,
                                }),
                            });
                        message.client.db.users.updatePoints.run(
                            {points: -amount},
                            message.author.id,
                            message.guild.id
                        );
                        msg.edit({embeds: [embed]});
                    }
                    //Win
                    else {
                        const embed = new MessageEmbed()
                            .setTitle(
                                `${modifier ? emojis.Voted : ''}${
                                    message.author.username
                                } gambling ${amount} Points ${emojis.point}`
                            )
                            .setDescription(
                                `🎉 You Won! **You now have ${points + amount}** ${
                                    emojis.point
                                }`
                            )
                            .setFooter({
                                text: `Your points: ${points + amount}.`,
                                iconURL: message.author.displayAvatarURL({
                                    dynamic: true,
                                }),
                            });
                        message.client.db.users.updatePoints.run(
                            {points: amount},
                            message.author.id,
                            message.guild.id
                        );
                        msg.edit({embeds: [embed]});
                    }
                    this.done(message.author.id);
                }, 3000);
            })
            .catch((e) => {
                console.log(e);
                this.done(message.author.id);
            });
    }
};
