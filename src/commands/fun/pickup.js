const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = class pickupCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'pickup',
      usage: 'pickup',
      description: 'Create a pickup line and send it to someone',
      type: client.types.FUN,
      examples: ['pickup @split']
    });
  }
  async run(message, args) {
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;
    try {
      const res = await fetch('http://www.pickuplinegen.com/');
      const pickup = (await res.text())
      var part = pickup.substring(
          pickup.lastIndexOf("id=\"content\">") + "id=\"content\">".length,
          pickup.lastIndexOf("<\div>")
      );
      console.log(part)
      const embed = new MessageEmbed()
        .setDescription(`<@${member.id}>, ${pickup}`)
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
