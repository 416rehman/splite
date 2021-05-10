const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = class dadjokeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'dadjoke',
      usage: 'dadjoke',
      description: 'Finds a random dadjoke.',
      type: client.types.FUN
    });
  }
  async run(message, args) {
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;
    try {
      const res = await fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json');
      const insult = (await res.json()).insult;

      const embed = new MessageEmbed()
        .setDescription(`<@${member.id}>, ${insult}`)
        .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
      message.channel.send(embed);
    } catch (err) {
      message.client.logger.error(err.stack);
      this.sendErrorMessage(message, 1, 'Please try again in a few seconds', err.message);
    }
  }
};
