const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class WipePointsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'odds',
      aliases: ['viewodds'],
      usage: 'odds <user mention/ID>',
      description: 'View the provided user\'s winning odds when using the gamble command.',
      type: client.types.POINTS,
      examples: ['odds @split']
    });
  }

  run(message, args) {
    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    const odds = message.client.odds.get(member.id).win || 55;
    const embed = new MessageEmbed()
        .setTitle('View Odds')
        .setDescription(`${member}'s gambling winning odds are: \`${odds}%\`.`)
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};