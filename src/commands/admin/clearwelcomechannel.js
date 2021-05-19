const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearWelcomeChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearwelcomechannel',
      aliases: ['clearwc', 'cwc'],
      usage: 'clearwelcomechannel',
      description: oneLine`
        Clears the welcome message text channel for your server. 
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearwelcomechannel']
    });
  }
  run(message, args) {

    let { welcome_channel_id: welcomeChannelId, welcome_message: welcomeMessage } = 
      message.client.db.settings.selectWelcomes.get(message.guild.id);
    const oldWelcomeChannel = message.guild.channels.cache.get(welcomeChannelId) || '`None`';

    // Get status
    const oldStatus = message.client.utils.getStatus(welcomeChannelId, welcomeMessage);

    // Trim message
    if (welcomeMessage && welcomeMessage.length > 1024) welcomeMessage = welcomeMessage.slice(0, 1021) + '...';

    const embed = new MessageEmbed()
      .setTitle('Settings: `Welcomes`')
      .setDescription(`The \`welcome channel\` was successfully cleared. ${success}`)
      .addField('Message', message.client.utils.replaceKeywords(welcomeMessage) || '`None`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateWelcomeChannelId.run(null, message.guild.id);

      // Update status
      const status = 'disabled';
      const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``; 
      
      return message.channel.send(embed
        .spliceFields(0, 0, { name: 'Channel', value: `${oldWelcomeChannel} ➔ \`None\``, inline: true })
        .spliceFields(1, 0, { name: 'Status', value: statusUpdate, inline: true })
      );

  }
};
