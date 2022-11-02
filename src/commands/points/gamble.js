const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

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
            slashCommand: new SlashCommandBuilder()
                .addIntegerOption(i => i.setName('amount').setDescription('The amount of points to gamble.').setDescription('The amount of points to gamble.'))
        });
    }

    run(message, args) {
        let amount = parseInt(args[0]);
        this.handle(amount, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const amount = interaction.options.getInteger('amount');
        await this.handle(amount, interaction, true);
    }

    async handle(amount, context, isInteraction) {
        const points = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);

        if (isNaN(amount) === true || !amount) {
            if (amount === 'all' || amount === 'max') amount = Math.min(points, this.client.config.stats.gambling.limit);
            else {
                this.done(context.author.id);

                const payload = `${emojis.fail} Please provide a valid amount of points to gamble.`;
                return this.sendReplyAndDelete(context, payload, isInteraction, 5000);
            }
        }

        if (amount < 0 || amount > points) {
            this.done(context.author.id);

            const payload = `${emojis.nep} Please provide an amount you currently have! You have **${points} points** ${emojis.point}`;
            if (isInteraction) context.editReply(payload).then(m => setTimeout(() => m.delete(), 5000));
            else (context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload)).then(m => setTimeout(() => m.delete(), 5000));
            return;
        }
        if (amount > this.client.config.stats.gambling.limit) {
            this.done(context.author.id);

            const payload = `${emojis.fail} You can't bet more than ${this.client.config.stats.gambling.limit} points ${emojis.point} at a time. Please try again!`;
            if (isInteraction) context.editReply(payload).then(m => setTimeout(() => m.delete(), 5000));
            else (context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload)).then(m => setTimeout(() => m.delete(), 5000));
            return;
        }

        const modifier = (await this.client.utils.checkTopGGVote(this.client, context.author.id))
            ? this.client.config.votePerks.gamblingWinOdds - this.client.config.stats.gambling.winOdds
            : 0;
        const embed = new EmbedBuilder()
            .setTitle(
                `${modifier ? emojis.Voted : ''}${this.getUserIdentifier(context.author)} gambling ${amount} points ${emojis.point}`
            )
            .setDescription(
                `${emojis.point} **Rolling** ${emojis.point}\n${emojis.dices}${emojis.dices}${emojis.dices}`
            )
            .setFooter({
                text: `Your points: ${points}.`,
                iconURL: this.getAvatarURL(context.author)
            });

        const payload = {embeds: [embed]};
        let msg;
        try {
            if (isInteraction) msg = await context.editReply(payload);
            else msg = context.loadingMessage ? await context.loadingMessage.edit(payload) : await context.reply(payload);
        }
        catch (e) {
            this.done(context.author.id);
            return;
        }


        setTimeout(() => {
            let odds = this.client.odds.get(context.author.id) || {
                win: this.client.config.stats.gambling.winOdds,
                lose: 1 - this.client.config.stats.gambling.winOdds,
            };
            odds.win += modifier;
            odds.lose -= modifier;

            const outcome = this.client.utils.weightedRandom(odds);

            //Loss
            if (outcome === 'lose') {
                const embed = new EmbedBuilder()
                    .setTitle(
                        `${modifier ? emojis.Voted : ''}${this.getUserIdentifier(context.author)} gambling ${amount} Points ${emojis.point}`
                    )
                    .setDescription(
                        `${emojis.fail} You lost! **You now have ${points - amount}** ${emojis.point}\n\n
                        ${modifier ? '' : `${emojis.Voted} Use the \`vote\` command to get a +10% boost to your odds`}`
                    )
                    .setFooter({
                        text: `Your points: ${points - amount}.`,
                        iconURL: this.getAvatarURL(context.author)
                    });
                this.client.db.users.updatePoints.run(
                    {points: -amount},
                    context.author.id,
                    context.guild.id
                );
                msg.edit({embeds: [embed]});
            }
            //Win
            else {
                const embed = new EmbedBuilder()
                    .setTitle(`${modifier ? emojis.Voted : ''}${this.getUserIdentifier(context.author)} gambling ${amount} Points ${emojis.point}`)
                    .setDescription(`🎉 You Won! **You now have ${points + amount}** ${emojis.point}`)
                    .setFooter({
                        text: `Your points: ${points + amount}.`,
                        iconURL: this.getAvatarURL(context.author)
                    });
                this.client.db.users.updatePoints.run(
                    {points: amount},
                    context.author.id,
                    context.guild.id
                );
                msg.edit({embeds: [embed]});
            }
            this.done(context.author.id);
        }, 5000);
    }
};
