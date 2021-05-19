const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearCrownChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearcrownchannel',
      aliases: ['clearcc', 'ccc'],
      usage: 'clearcrownchannel',
      description: oneLine`
        clears the crown message text channel for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearcrownchannel']
    });
  }
  run(message, args) {
    let { 
      crown_role_id: crownRoleId, 
      crown_channel_id: crownChannelId, 
      crown_message: crownMessage, 
      crown_schedule: crownSchedule 
    } = message.client.db.settings.selectCrown.get(message.guild.id);
    const crownRole = message.guild.roles.cache.get(crownRoleId);
    const oldCrownChannel = message.guild.channels.cache.get(crownChannelId) || '`None`';

    // Get status
    const status = message.client.utils.getStatus(crownRoleId, crownSchedule);
    
    // Trim message
    if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

    const embed = new MessageEmbed()
      .setTitle('Settings: `Crown`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`crown role\` was successfully cleared. ${success}`)
      .addField('Role', crownRole || '`None`', true)
      .addField('Schedule', `\`${(crownSchedule) ? crownSchedule : 'None'}\``, true)
      .addField('Status', `\`${status}\``)
      .addField('Message', message.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

      // Clear channel
      message.client.db.settings.updateCrownChannelId.run(null, message.guild.id);
      return message.channel.send(embed.spliceFields(1, 0, { 
        name: 'Channel', 
        value: `${oldCrownChannel} ➔ \`None\``, 
        inline: true
      }));
  }
};
