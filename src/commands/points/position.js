const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class PositionCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'position',
            aliases: ['pos'],
            usage: 'position <user mention/ID>',
            description: oneLine`
        Fetches a user's current leaderboard position. 
        If no user is given, your own position will be displayed.
      `,
            type: client.types.POINTS,
            examples: ['position @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setDescription('The user to get the position of').setRequired(false))
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

    handle(member, context, isInteraction) {

        const leaderboard = this.client.db.users.selectLeaderboard.all(context.guild.id);
        const pos = leaderboard.map((row) => row.user_id).indexOf(member.id) + 1;
        const ordinalPos = this.client.utils.getOrdinalNumeral(pos);

        const points = this.client.db.users.selectPoints
            .pluck()
            .get(member.id, context.guild.id);

        const embed = new MessageEmbed()
            .setTitle(`${this.getUserIdentifier(member)}'s Position`)
            .setThumbnail(this.getAvatarURL(member))
            .setDescription(`${member} is in **${ordinalPos}** place!`)
            .addField(
                'Position',
                `\`${pos}\` of \`${context.guild.memberCount}\``,
                true
            )
            .addField(`Points ${emojis.point}`, `\`${points}\``, true)
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);

        this.sendReply(context, {embeds: [embed]}, isInteraction);
    }
};
