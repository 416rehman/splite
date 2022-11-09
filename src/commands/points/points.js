const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class PointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'points',
            aliases: ['bal', 'balance', 'money', 'coins'],
            usage: 'points <user mention/ID>',
            description:
                'Fetches a user\'s  points. If no user is given, your own points will be displayed.',
            type: client.types.POINTS,
            examples: ['points @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setDescription('The user to get the points of').setRequired(false))
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args[0])) || message.member;
        if (!member) return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');

        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;

        await this.handle(member, interaction, true);
    }

    async handle(member, context) {
        const prefix = this.client.db.settings.selectPrefix.pluck().get(context.guild.id);
        const points = this.client.db.users.selectPoints.pluck().get(member.id, context.guild.id) || 0;
        const voted = await this.client.utils.checkTopGGVote(this.client, member.id) || false;

        const embed = new EmbedBuilder()
            .setTitle(`${this.getUserIdentifier(member)}'s Points ${emojis.point}`)
            .setThumbnail(this.getAvatarURL(member))
            .addFields([{name: 'Member', value:  member.toString(), inline:  true}])
            .addFields([{name: `Points ${emojis.point}`, value:  `\`${points}\``, inline:  true}])
            .setFooter({
                text: `Boost your odds: ${prefix}vote`,
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp();
        if (voted) embed.setDescription(`${emojis.Voted}**+10%** Gambling Odds`);
        await this.sendReply(context, {embeds: [embed]});
    }
};
