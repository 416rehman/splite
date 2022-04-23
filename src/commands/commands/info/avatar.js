const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class AvatarCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'avatar',
            aliases: ['profilepic', 'pic', 'av'],
            usage: 'avatar [user mention/ID]',
            description: 'Displays a user\'s avatar (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['avatar @split']
        });
    }

    run(message, args) {
        const member = this.getMemberFromMention(message, args[0]) ||
            message.guild.members.cache.get(args[0]) ||
            message.member;
        const serverAvatar = member.avatar && `https://cdn.discordapp.com/guilds/${message.guild.id}/users/${member.id}/avatars/${member.avatar}.png?size=512`

        const embed = new MessageEmbed()
            .setTitle(`${member.displayName}'s Avatar`)
            .setImage(serverAvatar || member.user.displayAvatarURL({dynamic: true, size: 512}))
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(member.displayHexColor);
        if (serverAvatar) {
            embed.setThumbnail(member.user.displayAvatarURL({dynamic: true, size: 512}))
            embed.addField(`Default Avatar 👉`, `Server-Only Avatar 👇`)
        }
        message.channel.send({embeds: [embed]});
    }
};
