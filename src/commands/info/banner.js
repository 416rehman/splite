const Command = require('../Command.js');
const {getUserBanner} = require("discord-banner");
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
    getUserBanner(member.id || member.user.id, {
      token: message.client.token,
    }).then(async banner => {
      if (banner.url) {
        return await message.channel.send(new MessageEmbed()
            .setTitle(`${member.displayName}'s Banner`)
            .setImage(banner.url)
            .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
            .setTimestamp()
            .setColor(member.displayHexColor));
      }
      await message.reply(`${member} does not have a banner.`)
    });
  }
};
