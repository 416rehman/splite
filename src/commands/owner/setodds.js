const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class WipePointsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setodds',
      aliases: ['oseto', 'oso'],
      usage: 'setodds <user mention/ID> <0-100 winning percentage>',
      description: 'Set the provided user\'s winning odds when gambling.',
      type: client.types.OWNER,
      ownerOnly: true,
      examples: ['setodds @split']
    });
  }
  run(message, args) {
    const member =  this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) 
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (isNaN(args[1]))
      return this.sendErrorMessage(message, 0, 'Please provide the amount of points to set');
    message.client.odds.set(member.id, {lose: 100 - parseInt(args[1]), win:parseInt(args[1])})
    const embed = new MessageEmbed()
      .setTitle('Set Odds')
      .setDescription(`Successfully set ${member}'s winning odds to \`${args[1]}%\`.`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send({embeds: [embed]});
  } 
};