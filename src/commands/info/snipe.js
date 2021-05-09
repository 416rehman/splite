const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { pong } = require('../../utils/emojis.json');
const { fail } = require('../../utils/emojis.json')
module.exports = class SnipeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'snipe',
      usage: 'snipe',
      description: 'Shows the most recently deleted message in the channel',
      type: client.types.INFO
    });
  }
  async run(message) {
    const embed = new MessageEmbed()
      .setDescription('`Sniping...`')
      .setColor("RANDOM");
    const msg = await message.channel.send(embed);


   const snipedMSg = message.guild.snipes.get(message.channel.id)
    console.log(snipedMSg)
    if (snipedMSg)
    {
        if (snipedMSg.content || snipedMSg.attachments)
        embed.setDescription(`${snipedMSg.content ? snipedMSg.content : ''}`)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setImage(`${snipedMSg.attachments.size > 0 ? snipedMSg.attachments[0].url : ''}`)
          .setTimestamp()
          .setAuthor(`${snipedMSg.author.username}#${snipedMSg.author.discriminator}`, `https://cdn.discordapp.com/avatars/${snipedMSg.author.id}/${snipedMSg.author.avatar}.png`)
      msg.edit(embed);
    }
    else
    {
      embed.setTitle(`Splite Sniper`)
          .setDescription(`${fail} There is nothing to snipe!`)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
      msg.edit(embed);
    }
  }
};
