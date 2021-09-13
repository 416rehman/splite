const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetWelcomeChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setwelcomechannel',
      aliases: ['setwc', 'swc'],
      usage: 'setwelcomechannel <channel mention/ID>',
      description: oneLine`
        Sets the welcome message text channel for your server.      
        A \`welcome message\` must also be set to enable welcome messages.
        \nUse \`clearwelcomechannel\` to clear the current \`welcome channel\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setwelcomechannel #general','clearwelcomechannel']
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
      .addField('Message', message.client.utils.replaceKeywords(welcomeMessage) || '`None`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send({embeds: [embed
        .spliceFields(0, 0, { name: 'Current Welcome Channel', value: `${oldWelcomeChannel}`, inline: true })
        .spliceFields(1, 0, { name: 'Status', value: `\`${oldStatus}\``, inline: true }).setDescription(this.description)
      ]});
    }

    embed.setDescription(`The \`welcome channel\` was successfully updated. ${success}\nUse \`clearwelcomechannel\` to clear the current \`welcome channel\`.`)
    const welcomeChannel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!welcomeChannel || (welcomeChannel.type != 'GUILD_TEXT' && welcomeChannel.type != 'GUILD_NEWS') || !welcomeChannel.viewable)
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID
      `);

    // Update status
    const status =  message.client.utils.getStatus(welcomeChannel, welcomeMessage);
    const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

    message.client.db.settings.updateWelcomeChannelId.run(welcomeChannel.id, message.guild.id);
    message.channel.send({embeds: [embed
      .spliceFields(0, 0, { name: 'Channel', value: `${oldWelcomeChannel} ➔ ${welcomeChannel}`, inline: true})
      .spliceFields(1, 0, { name: 'Status', value: statusUpdate, inline: true})
    ]});
  }
};
