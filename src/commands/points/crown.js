const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json')

module.exports = class CrownCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'crown',
      aliases: ['crowned'],
      usage: 'crown',
      description: 'Displays all crowned guild members, the crown role, and crown schedule.',
      type: client.types.POINTS
    });
  }
  run(message) {
    const { crown_role_id: crownRoleId, crown_schedule: crownSchedule } = 
      message.client.db.settings.selectCrown.get(message.guild.id);
    const crownRole = message.guild.roles.cache.get(crownRoleId) || '`None`';
    const crowned = message.guild.members.cache.filter(m => {
      if (m.roles.cache.find(r => r === crownRole)) return true;
    }).array();

    let description = message.client.utils.trimStringFromArray(crowned);
    if (crowned.length === 0) description = `No one has the crown! ${emojis.crown}`;

    const embed = new MessageEmbed()
      .setTitle(`${emojis.crown}  Crowned Members  ${emojis.crown}`)
      .setDescription(description)
      .addField('Crown Role', crownRole)
      .setFooter(`Crown transfer will occur at 20:00 EST`)
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};