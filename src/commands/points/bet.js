const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

const emojis = require('../../utils/emojis.json');
const {MessageButton} = require('discord.js');
const {MessageActionRow} = require('discord.js');

const limit = 1000;

module.exports = class betCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet',
            usage: 'bet <user mention/id/name> <point count>',
            description: 'Bet against someone. Winner receives double the bet amount',
            type: client.types.POINTS,
            examples: ['bet @split 1000'],
            exclusive: true,
        });
    }

    async run(message, args) {
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            this.done(message.author.id);
            return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
        }
        if (member.id === message.client.user.id) {
            this.done(message.author.id);
            return message.channel
                .send(`${emojis.fail} Sorry I am not allowed to play with you 😟`)
                .then((m) => {
                    setTimeout(() => m.delete(), 5000);
                });
        }

        if (member.user.id == message.author.id) {
            this.done(message.author.id);
            return message
                .reply(`${emojis.fail} No stupid, you NEVER bet against yourself!!`)
                .then((m) => {
                    setTimeout(() => m.delete(), 5000);
                });
        }

        if (this.instances.has(member.user.id)) {
            this.done(message.author.id);
            return message
                .reply(`${emojis.fail} ${member.user.username} is already betting against someone! Please try again later.`)
                .then((m) => {
                    setTimeout(() => m.delete(), 5000);
                });
        }

        let amount = parseInt(args[1]);
        if (isNaN(amount) === true || !amount) {
            this.done(message.author.id);
            return this.sendErrorMessage(message, 0, 'Please provide a valid point count');
        }

        const points = message.client.db.users.selectPoints
            .pluck()
            .get(message.author.id, message.guild.id);
        const otherPoints = message.client.db.users.selectPoints
            .pluck()
            .get(member.user.id, message.guild.id);

        if (amount < 0 || amount > points) {
            this.done(message.author.id);
            return message
                .reply(`${emojis.nep} Please provide an amount you currently have! You have ${points} points ${emojis.point}`)
                .then((m) => setTimeout(() => m.delete(), 5000));
        }
        if (amount > limit) amount = limit;
        if (amount < 0 || amount > otherPoints) {
            this.done(message.author.id);
            return message
                .reply(`${emojis.nep} ${member.user.username} only has ${otherPoints} points ${emojis.point}! Please change your betting amount!`)
                .then((m) => {
                    setTimeout(() => m.delete(), 5000);
                });
        }

        this.setInstance(member.user.id);

        const row = new MessageActionRow();
        row.addComponents(new MessageButton()
            .setCustomId('proceed')
            .setLabel('✅ Accept')
            .setStyle('SUCCESS'));
        row.addComponents(new MessageButton()
            .setCustomId('cancel')
            .setLabel('❌ Decline')
            .setStyle('DANGER'));

        try {
            message.channel
                .send({
                    content: `${member}, ${message.author.username} has sent you a bet of ${amount} points ${emojis.point}. Do you accept?`,
                    components: [row],
                })
                .then((msg) => {
                    const filter = (button) => button.user.id === member.id;
                    const collector = msg.createMessageComponentCollector({
                        filter, componentType: 'BUTTON', time: 60000, dispose: true,
                    });

                    let updated = false;
                    collector.on('collect', (b) => {
                        updated = true;
                        if (b.customId === 'proceed') {
                            const embed = new MessageEmbed()
                                .setTitle(`${message.author.username} VS ${member.user.username}`)
                                .setDescription(`${emojis.point} **Rolling for ${amount} points** ${emojis.point}\n${emojis.dices}${emojis.dices}${emojis.dices}`)
                                .setFooter({
                                    text: `${message.author.username} (${points} points) VS ${member.user.username} (${otherPoints} points)`,
                                });
                            message.channel
                                .send({embeds: [embed]})
                                .then((msg2) => {
                                    msg.delete();
                                    setTimeout(() => {
                                        const d = message.client.utils.weightedRandom({
                                            0: 50, 1: 50,
                                        });

                                        let winner = message.author;
                                        if (d == 1) winner = member.user;

                                        const winnerPoints = winner.id === member.id ? otherPoints : points;

                                        const loser = winner.id === member.id ? message.author : member.user;
                                        const loserPoints = winner.id === member.id ? points : otherPoints;

                                        message.client.db.users.updatePoints.run({points: -amount}, loser.id, message.guild.id);
                                        message.client.db.users.updatePoints.run({points: amount}, winner.id, message.guild.id);

                                        this.done(message.author.id);
                                        this.done(member.user.id);
                                        const embed = new MessageEmbed()
                                            .setTitle(`${message.author.username} VS ${member.user.username}`)
                                            .setDescription(`🎉 ${winner} has won ${amount} points ${emojis.point} from ${loser}!`)
                                            .setFooter({
                                                text: `🏆 ${winner.username}'s points: ${winnerPoints + amount} | ${loser.username}'s points: ${loserPoints - amount}`,
                                            });
                                        msg2.edit({embeds: [embed], components: []});
                                    }, 3000);
                                })
                                .catch((e) => {
                                    console.log(e);
                                });
                        }
                        else {
                            this.done(message.author.id);
                            this.done(member.user.id);
                            msg.edit(`${emojis.fail} ${message.author}, ${member.user.username} has rejected your bet!`).then((msg) => {
                                setTimeout(() => msg.delete(), 5000);
                            });
                        }
                    });

                    collector.on('end', () => {
                        this.done(message.author.id);
                        this.done(member.user.id);
                        if (updated) return;
                        msg.edit({
                            components: [], content: `${member} did not accept the bet - Expired`,
                        });
                    });
                });
        }
        catch (e) {
            console.log(e);
        }
    }
};
