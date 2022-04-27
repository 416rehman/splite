const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class BannerCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'banner',
            aliases: ['cover', 'b', 'bav'],
            usage: 'banner [user mention/ID]',
            description:
                'Displays a user\'s banner (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['banner @split'],
        });
    }

    async run(message, args) {
        const member = await message.client.api
            .users(
                (await this.getMemberFromMention(message, args[0]))?.id ||
                (
                    await message.guild.members.cache.get(args[0])
                )?.id ||
                message.member.id
            )
            .get();
        const banner =
            member.banner &&
            `https://cdn.discordapp.com/banners/${member.id}/${member.banner}${
                member.banner.startsWith('a_') ? '.gif' : '.png'
            }?size=512`;

        const embed = new MessageEmbed()
            .setTitle(`${member.username}'s Banner`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);

        if (banner) embed.setImage(banner);
        else
            embed.setDescription(
                `${fail} **${member.username}** has not setup their banner.`
            );

        message.channel.send({embeds: [embed]});
    }
};
