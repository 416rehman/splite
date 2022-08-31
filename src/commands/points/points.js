const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

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

        this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;

        this.handle(member, interaction, true);
    }

    async handle(member, context, isInteraction) {
        const prefix = this.client.db.settings.selectPrefix.pluck().get(context.guild.id);
        const points = this.client.db.users.selectPoints.pluck().get(member.id, context.guild.id) || 0;
        const voted = await this.client.utils.checkTopGGVote(this.client, member.id);

        const embed = new MessageEmbed()
            .setTitle(`${this.getUserIdentifier(member)}'s ${emojis.point}`)
            .setThumbnail(this.getAvatarURL(member))
            .setDescription(
                `${voted ? `${emojis.Voted}**+10%** Gambling Odds` : ''}`
            )
            .addField('Member', member.toString(), true)
            .addField(`Points ${emojis.point}`, `\`${points}\``, true)
            .setFooter({
                text: `Boost your odds: ${prefix}vote`,
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp()
            .setColor(member.displayHexColor);
        this.sendReply(context, {embeds: [embed]}, isInteraction);
    }
};
