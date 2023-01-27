const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class GivePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'givepoints',
            aliases: ['gp', 'give', 'send'],
            usage: 'givepoints <user mention/ID> <point count>',
            description:
                'Gives the specified amount of your own points to the mentioned user.',
            type: client.types.POINTS,
            examples: ['givepoints @split 1000'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to give points to.'))
                .addIntegerOption(i => i.setName('amount').setRequired(true).setDescription('The amount of points to give.'))
        });
    }

    async run(message, args) {
        if (args.length < 2) {
            const payload = {embeds: [this.createErrorEmbed('You must specify a user and an amount of points to give')]};
            return this.sendReplyAndDelete(message, payload);
        }
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            const payload = {embeds: [this.createErrorEmbed('Please mention a user or provide a valid user ID')]};
            return this.sendReplyAndDelete(message, payload);
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

    handle(member, amount, context) {
        if (member.id === this.client.user.id) {
            const payload = `${emojis.fail} Thank you, you're too kind! But I must decline. I prefer not to take handouts.`;
            return this.sendReplyAndDelete(context, payload, 5000);
        }

        if (member.id === context.author.id) {
            const payload = `${emojis.fail} You can't give yourself points.`;
            return this.sendReplyAndDelete(context, payload, 5000);
        }

        const points = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);

        if (isNaN(amount) === true || !amount) {
            const payload = `${emojis.fail} Please provide a valid amount of points to give.`;
            return this.sendReplyAndDelete(context, payload);
        }

        if (amount < 0 || amount > points) {
            const payload = `${emojis.fail} Please provide a point count less than or equal to **${points}** (your total points)`;
            return this.sendReplyAndDelete(context, payload);
        }

        // Remove points
        this.client.db.users.updatePoints.run(
            {points: -amount},
            context.author.id,
            context.guild.id
        );
        // Add points
        const oldPoints = this.client.db.users.selectPoints
            .pluck()
            .get(member.id, context.guild.id);
        this.client.db.users.updatePoints.run(
            {points: amount},
            member.id,
            context.guild.id
        );
        let description = `${emojis.success} Successfully transferred **${amount}** points ${emojis.point} to ${member}!`;
        const embed = new EmbedBuilder()
            .setTitle(`${this.getUserIdentifier(member)}'s Points ${emojis.point}`)
            .setThumbnail(this.getAvatarURL(member))
            .setDescription(description)
            .addFields(
                {name: 'From', value: context.member.toString(), inline: true},
                {name: 'To', value: member.toString(), inline: true},
                {name: 'Points', value: `\`${oldPoints}\` ➔ \`${amount + oldPoints}\``, inline: true}
            )
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.member)
            })
            .setTimestamp();

        const payload = {
            content: `Giving ${amount} points to ${member}`,
            embeds: [embed]
        };
        this.sendReply(context, payload);
    }
};
