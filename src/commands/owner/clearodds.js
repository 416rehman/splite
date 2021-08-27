const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class WipePointsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearodds',
      aliases: ['oclearo', 'oco'],
      usage: 'clearodds <user mention/ID>',
      description: 'Clear the provided user\'s winning odds for gambling.',
      type: client.types.OWNER,
      ownerOnly: true,
      examples: ['clearodds @split']
    });
  }
  run(message, args) {
    const member =  this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    message.client.odds.delete(member.id)
    const embed = new MessageEmbed()
        .setTitle('Clear Odds')
        .setDescription(`Successfully cleared ${member}'s winning odds to default.`)
        .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  } 
};