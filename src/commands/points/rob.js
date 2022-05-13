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
                    .setName('target')
                    .setDescription('The amount of points you want to drop.'))
        });
    }

    interact(interaction, args, author) {
        const target = interaction.options.getUser('target');
        this.handle(target, author, interaction, true);
    }

    async run(message, args) {
        if (args.length === 0) {
            return message.reply('You need to specify a user to rob.');
        }
        let target = await this.getGuildMember(message.guild, args[0]);
        if (!target) {
            return message.reply('I couldn\'t find that user.');
        }
        this.handle(target, message.author, message);
    }

    handle(target, author, context, isInteraction = false) {
        let target_balance = this.client.db.users.selectPoints
            .pluck()
            .get(target.id, context.guild.id);
        if (!target_balance) {
            return context.reply('That user has no points.');
        }

        let author_balance = this.client.db.users.selectPoints
            .pluck()
            .get(author.id, context.guild.id);
        if (!author_balance) {
            return context.reply('You don\'t have any points.');
        }

        context.reply({
            embeds: [
                new MessageEmbed()
                    .setDescription(`${this.getUserIdentifier(author)} is trying to rob ${this.getUserIdentifier(target)}...`)
            ]
        }).then(async (msg) => {
            let amount = this.client.utils.getRandomInt(1, Math.min(author_balance, target_balance) / 2);
            if (amount > target_balance) {
                amount = target_balance;
            }
            if (amount > this.client.config.stats.robbing.limit) {
                amount = this.client.config.stats.robbing.limit;
            }
            const hasVoted = (await this.client.utils.checkTopGGVote(
                this.client,
                author.id
            ));

            const outcome = this.client.utils.weightedRandom({
                success: hasVoted ? this.client.config.stats.robbing.successOdds : this.client.config.votePerks.robbingSuccessOdds,
                fail: 1 - this.client.config.stats.robbing.successOdds
            });

            if (outcome === 'success') {
                // take points from target and give them to author
                this.client.db.users.updatePoints.run({points: -amount}, target.id, context.guild.id);
                this.client.db.users.updatePoints.run({points: amount}, author.id, context.guild.id);

                const verbs = [
                    'stole',
                    'got away with',
                    'mugged',
                    'robbed',
                    'fled with',
                    'ran away with',
                ];

                const embed = new MessageEmbed()
                    .setTitle(`${hasVoted ? emojis.Voted : ''} ${this.getUserIdentifier(author)} robbed ${this.getUserIdentifier(target)}!`)
                    .setDescription(`${emojis.success} They ${verbs[this.client.utils.getRandomInt(0, verbs.length - 1)]} **${amount}** ${emojis.point}`)
                    .setFooter({
                        text: 'To check your balance, use the `points` command!',
                    });

                if (hasVoted) embed.setFooter({
                    text: 'Use the "vote" command to boost your chances of success!'
                });

                return isInteraction ? context.editReply({embeds: [embed]}) : msg.edit({embeds: [embed]});
            }
            else {
                // take points from author and give them to target
                this.client.db.users.updatePoints.run({points: -amount}, author.id, context.guild.id);
                this.client.db.users.updatePoints.run({points: amount}, target.id, context.guild.id);

                const versions = [
                    `${this.getUserIdentifier(target)} fought back and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} thwarted ${this.getUserIdentifier(author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} retaliated and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} blocked ${this.getUserIdentifier(author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} countered ${this.getUserIdentifier(author)}'s robbery and stole **${amount}** points.`,
                    `${this.getUserIdentifier(target)} overpowered ${this.getUserIdentifier(author)} and stole **${amount}** points.`,
                ];

                const embed = new MessageEmbed()
                    .setTitle(`${this.getUserIdentifier(author)} tried to rob ${this.getUserIdentifier(target)}!`)
                    .setDescription(`${emojis.fail} ${versions[this.client.utils.getRandomInt(0, versions.length - 1)]} ${emojis.point}`)
                    .setFooter({
                        text: 'To check your balance, use the `points` command!',
                    });

                if (hasVoted) embed.setFooter({
                    text: 'Use the "vote" command to boost your chances of success!'
                });

                return isInteraction ? context.editReply({embeds: [embed]}) : msg.edit({embeds: [embed]});
            }
        });
    }
};
