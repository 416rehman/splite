const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class AvatarCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'banner',
      aliases: ['cover'],
      usage: 'banner [user mention/ID]',
      description: 'Displays a user\'s banner (or your own, if no user is mentioned).',
      type: client.types.INFO,
      examples: ['banner @split']
    });
  }
  async run(message, args) {
    const member = this.getMemberFromMention(message, args[0]) ||
        message.guild.members.cache.get(args[0]) ||
        message.member;
    const embed = new MessageEmbed()
        .setTitle(`${member.displayName}'s Avatar`)
        .setImage(await member.user.bannerURL())
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(member.displayHexColor);
    await message.channel.send(embed);
  }
};
