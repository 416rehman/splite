const Command = require('../Command.js');
const {isNumber} = require("node-os-utils");
const { MessageEmbed } = require('discord.js');

module.exports = class WipePointsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setpoints',
      aliases: ['osetp', 'osp'],
      usage: 'setpoints <user mention/ID> <amount>',
      description: 'Set the provided user\'s points.',
      type: client.types.OWNER,
      ownerOnly: true,
      examples: ['setpoints @split']
    });
  }
  run(message, args) {
    const member =  this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) 
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (!isNumber(args[1]))
      return this.sendErrorMessage(message, 0, 'Please provide the amount of points to set');
    message.client.db.users.setPoints.run(args[1], member.id, message.guild.id);
    const embed = new MessageEmbed()
      .setTitle('Set Points')
      .setDescription(`Successfully set ${member}'s points to ${args[1]}.`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  } 
};