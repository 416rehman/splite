const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearMessageEditLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearmessageeditlog',
      aliases: ['clearmsgeditlog', 'clearmel', 'cmel'],
      usage: 'clearmessageeditlog',
      description: oneLine`
        Clears the message edit log text channel for your server. 
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearmessageeditlog']
    });
  }
  run(message, args) {
    const messageEditLogId = message.client.db.settings.selectMessageEditLogId.pluck().get(message.guild.id);
    const oldMessageEditLog = message.guild.channels.cache.get(messageEditLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`message edit log\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateMessageEditLogId.run(null, message.guild.id);
      return message.channel.send(embed.addField('Message Edit Log', `${oldMessageEditLog} ➔ \`None\``));

  }
};
