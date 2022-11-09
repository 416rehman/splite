const Command = require('../Command.js');
const {EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class betCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet',
            usage: 'bet <user mention/id/name> <point count>',
            description: 'Bet against someone. Winner receives double the bet amount',
            type: client.types.POINTS,
            examples: ['bet @split 1000'],
            exclusive: true,
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to bet against'))
                .addIntegerOption(i => i.setName('amount').setRequired(true).setDescription('The amount of points to bet'))
        });
    }

    async run(message, args) {
        if (args.length < 2) {
            return this.sendReplyAndDelete(message, {embeds: [this.createErrorEmbed('You must specify a user and an amount of points to bet.')]}, false);
        }
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            this.done(message.author.id);
            return this.sendReplyAndDelete(message, {embeds: [this.createErrorEmbed('Please mention a user or provide a valid user ID')]}, false);
        }

        let amount = parseInt(args[1]);
        await this.handle(member, amount, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;
        const points = interaction.options.getInteger('amount');
        await this.handle(member, points, interaction, true);
    }

    async handle(member, amount, context) {
        if (isNaN(amount) === true || !amount) {
            if (amount !== 'all' && amount !== 'max') {
                this.done(context.author.id);

                const payload = 'Please provide a valid amount of points to bet.';
                return this.sendReplyAndDelete(context, payload);
            }
        }
        if (member.id === this.client.user.id) {
            this.done(context.author.id);
            const payload = `${emojis.fail} Sorry I am not allowed to play with you 😟`;
            return this.sendReplyAndDelete(context, payload);
        }

        if (member.id === context.author.id) {
            this.done(context.author.id);
            const payload = `${emojis.fail} No stupid, you NEVER bet against yourself!!`;
            return this.sendReplyAndDelete(context, payload);
        }

        if (this.instances.has(member.id)) {
            this.done(context.author.id);
            const payload = `${emojis.fail} ${this.getUserIdentifier(member)} is already betting against someone! Please try again later.`;
            return this.sendReplyAndDelete(context, payload);
        }

        const points = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);
        const otherPoints = this.client.db.users.selectPoints
            .pluck()
            .get(member.id, context.guild.id);

        if (amount === 'all' && amount === 'max') {
            amount = Math.min(amount, otherPoints, this.client.config.stats.betting.limit);
        }

        if (amount < 0 || amount > points) {
            this.done(context.author.id);
            const payload = `${emojis.nep} Please provide an amount you currently have! You have ${points} points ${emojis.point}`;
            return this.sendReplyAndDelete(context, payload);
        }
        if (amount > this.client.config.stats.betting.limit) amount = this.client.config.stats.betting.limit;
        if (amount < 0 || amount > otherPoints) {
            this.done(context.author.id);
            const payload = `${emojis.nep} ${this.getUserIdentifier(member)} only has ${otherPoints} points ${emojis.point}! Please change your betting amount!`;
            return this.sendReplyAndDelete(context, payload);
        }

        const row = new ActionRowBuilder();
        row.addComponents(new ButtonBuilder()
            .setCustomId('proceed')
            .setLabel('✅ Accept')
            .setStyle(ButtonStyle.Success));
        row.addComponents(new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('❌ Decline')
            .setStyle(ButtonStyle.Danger));

        try {

            const payload = {
                content: `${member}, ${this.getUserIdentifier(context.author)} has sent you a bet of ${amount} points ${emojis.point}. Do you accept?`,
                components: [row],
            };
            let msg = await this.sendReply(context, payload);

            const filter = (button) => button.user.id === member.id;
            const collector = msg.createMessageComponentCollector({
                filter, componentType: ComponentType.Button, time: 60000, dispose: true,
            });

            let updated = false;
            collector.on('collect', (b) => {
                updated = true;
                if (b.customId === 'proceed') {
                    const embed = new EmbedBuilder()
                        .setTitle(`${this.getUserIdentifier(context.author)} VS ${this.getUserIdentifier(member)}`)
                        .setDescription(`${emojis.point} **Rolling for ${amount} points** ${emojis.point}\n${emojis.dices}${emojis.dices}${emojis.dices}`)
                        .setFooter({
                            text: `${this.getUserIdentifier(context.author)} (${points} points) VS ${this.getUserIdentifier(member)} (${otherPoints} points)`,
                        });
                    msg.edit({embeds: [embed]}).then((msg2) => {
                        setTimeout(() => {
                            const d = this.client.utils.weightedRandom({
                                0: 50, 1: 50,
                            });

                            let winner = context.author;
                            if (d === 1) winner = member;

                            const winnerPoints = winner.id === member.id ? otherPoints : points;

                            const loser = winner.id === member.id ? context.author : member;
                            const loserPoints = winner.id === member.id ? points : otherPoints;

                            this.client.db.users.updatePoints.run({points: -amount}, loser.id, context.guild.id);
                            this.client.db.users.updatePoints.run({points: amount}, winner.id, context.guild.id);

                            this.done(context.author.id);
                            this.done(member.id);
                            const embed = new EmbedBuilder()
                                .setTitle(`${this.getUserIdentifier(context.author)} VS ${this.getUserIdentifier(member)}`)
                                .setDescription(`🎉 ${winner} has won ${amount} points ${emojis.point} from ${loser}!`)
                                .setFooter({
                                    text: `🏆 ${this.getUserIdentifier(winner)}'s points: ${winnerPoints + amount} | ${this.getUserIdentifier(loser)}'s points: ${loserPoints - amount}`,
                                });
                            msg2.edit({embeds: [embed], components: []});
                        }, 3000);
                    })
                        .catch((e) => {
                            this.done(context.author.id);
                            this.done(member.id);
                            console.log(e);
                        });
                }
                else {
                    this.done(context.author.id);
                    this.done(member.id);
                    msg.edit({
                        content: `${emojis.fail} ${context.author}, ${this.getUserIdentifier(member)} has rejected your bet!`,
                        components: []
                    }).then((msg) => {
                        setTimeout(() => msg.delete(), 5000);
                    });
                }
            });

            collector.on('end', () => {
                this.done(context.author.id);
                this.done(member.id);
                if (updated) return;
                msg.edit({
                    components: [], content: `${member} did not accept the bet - Expired`,
                });
            });
        }
        catch (e) {
            this.done(context.author.id);
            this.done(member.id);
            console.log(e);
        }
    }
};
