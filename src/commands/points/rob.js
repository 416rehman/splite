const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rob',
            aliases: ['steal', 'mug', 'raid'],
            usage: 'rob <user>',
            description: 'Attempt to steal points from another user.\nIf you fail, you will be robbed and lose points.',
            type: client.types.POINTS,
            examples: ['rob @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((option) =>
                option
                    .setRequired(true)
                    .setName('user')
                    .setDescription('The user to rob points from'))
        });
    }

    async run(message, args) {
        if (args.length === 0) {
            return message.reply('You need to specify a user to rob.');
        }
        let target = await this.getGuildMember(message.guild, args[0]);
        if (!target) {
            return message.reply('I couldn\'t find that user.');
        }
        this.handle(target, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user');
        this.handle(target, interaction, true);
    }

    handle(target, context, isInteraction) {
        if (!target) {
            return this.sendReplyAndDelete(context, 'Please provide a valid user.', isInteraction);
        }

        if (target.id === context.author.id) {
            return this.sendReplyAndDelete(context, 'You can\'t rob yourself 🤦‍', isInteraction);
        }

        let target_balance = this.client.db.users.selectPoints
            .pluck()
            .get(target.id, context.guild.id);
        if (!target_balance) {
            return this.sendReplyAndDelete(context, `${emojis.nep} That user has no points.`, isInteraction);
        }

        let author_balance = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);
        if (!author_balance) {
            return this.sendReplyAndDelete(context, `${emojis.nep} You have no points.`, isInteraction);
        }

        this.sendReply(context, {
            embeds: [
                new MessageEmbed()
                    .setDescription(`${this.getUserIdentifier(context.author)} is trying to rob ${this.getUserIdentifier(target)}...`)
            ]
        }, isInteraction).then(async (msg) => {
            let amount = this.client.utils.getRandomInt(1, Math.min(author_balance, target_balance) / 2);
            if (amount > target_balance) {
                amount = target_balance;
            }
            if (amount > this.client.config.stats.robbing.limit) {
                amount = this.client.config.stats.robbing.limit;
            }
            const hasVoted = (await this.client.utils.checkTopGGVote(
                this.client,
                context.author.id
            ));

            const outcome = this.client.utils.weightedRandom({
                success: hasVoted ? this.client.config.stats.robbing.successOdds : this.client.config.votePerks.robbingSuccessOdds,
                fail: 1 - this.client.config.stats.robbing.successOdds
            });

            if (outcome === 'success') {
                // take points from target and give them to author
                this.client.db.users.updatePoints.run({points: -amount}, target.id, context.guild.id);
                this.client.db.users.updatePoints.run({points: amount}, context.author.id, context.guild.id);

                const verbs = [
                    'stole',
                    'got away with',
                    'mugged',
                    'robbed',
                    'fled with',
                    'ran away with',
                ];

                const embed = new MessageEmbed()
                    .setTitle(`${hasVoted ? emojis.Voted : ''} ${this.getUserIdentifier(context.author)} robbed ${this.getUserIdentifier(target)} points!`)
                    .setDescription(`${emojis.success} They ${verbs[this.client.utils.getRandomInt(0, verbs.length - 1)]} **${amount}** ${emojis.point}`)
                    .setFooter({
                        text: 'To check your balance, use the `points` command!',
                    });

                if (!hasVoted) embed.setFooter({
                    text: 'Use the "vote" command to boost your chances of success!'
                });

                return msg.edit({
                    embeds: [embed]
                });
            }
            else {
                // take points from author and give them to target
                this.client.db.users.updatePoints.run({points: -amount}, context.author.id, context.guild.id);
                this.client.db.users.updatePoints.run({points: amount}, target.id, context.guild.id);

                const versions = [
                    `${this.getUserIdentifier(target)} fought back and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} thwarted ${this.getUserIdentifier(context.author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} retaliated and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} blocked ${this.getUserIdentifier(context.author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} countered ${this.getUserIdentifier(context.author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} overpowered ${this.getUserIdentifier(context.author)} and stole **${amount}** points.`,
                ];

                const embed = new MessageEmbed()
                    .setTitle(`${this.getUserIdentifier(context.author)} tried to rob ${this.getUserIdentifier(target)}!`)
                    .setDescription(`${emojis.fail} ${versions[this.client.utils.getRandomInt(0, versions.length - 1)]} ${emojis.point}`)
                    .setFooter({
                        text: 'To check your balance, use the `points` command!',
                    });

                if (!hasVoted) embed.setFooter({
                    text: 'Use the "vote" command to boost your chances of success!'
                });

                return msg.edit({
                    embeds: [embed]
                });
            }
        });
    }
};
