const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class PointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'points',
            aliases: ['bal', 'balance', 'money'],
            usage: 'points <user mention/ID>',
            description:
            'Fetches a user\'s  points. If no user is given, your own points will be displayed.',
            type: client.types.POINTS,
            examples: ['points @split'],
        });
    }

    async run(message, args) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);
        const member =
         this.getMemberFromMention(message, args[0]) ||
         message.guild.members.cache.get(args[0]) ||
         message.member;
        const points =
         message.client.db.users.selectPoints
             .pluck()
             .get(member.id, message.guild.id) || 0;
        const voted = await message.client.utils.checkTopGGVote(
            message.client,
            member.id
        );
        const embed = new MessageEmbed()
            .setTitle(`${this.getUserIdentifier(member)}'s ${emojis.point}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `${voted ? `${emojis.Voted}**+10%** Gambling Odds` : ''}`
            )
            .addField('Member', member.toString(), true)
            .addField(`Points ${emojis.point}`, `\`${points}\``, true)
            .setFooter({
                text: `Boost your odds: ${prefix}vote`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);
        message.channel.send({ embeds: [embed] });
    }
};
