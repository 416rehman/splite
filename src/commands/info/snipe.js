const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { pong } = require('../../utils/emojis.json');

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
      .setColor(message.guild.me.displayHexColor);    
    const msg = await message.channel.send(embed);

    const snipedMSg = message.guild.snipes.find(message.channel.id)
    console.log(message.guild.snipes)
    if (snipedMSg)
    {
      embed.setTitle(`Pong!  ${pong}`)
          .setDescription('')
          .addField('Latency', latency, true)
          .addField('API Latency', apiLatency, true)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
      msg.edit(embed);
    }
  }
};
