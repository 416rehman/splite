const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetMessageDeleteLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setmessagedeletelog',
      aliases: ['setmsgdeletelog', 'setmdl', 'smdl'],
      usage: 'setmessagedeletelog <channel mention/ID>',
      description: oneLine`
        Sets the message delete log text channel for your server. 
        \nUse \`clearmessagedeletelog\` to clear the current \`message delete log\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setmessagedeletelog #bot-log','clearmessagedeletelog']
    });
  }
  run(message, args) {
    const messageDeleteLogId = message.client.db.settings.selectMessageDeleteLogId.pluck().get(message.guild.id);
    const oldMessageDeleteLog = message.guild.channels.cache.get(messageDeleteLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send({embeds: [embed.addField('Current Message Delete Log', `${oldMessageDeleteLog}`).setDescription(this.description)]});
    }

    embed.setDescription(`The \`message delete log\` was successfully updated. ${success}\nUse \`clearmessagedeletelog\` to clear the current \`message delete log\`.`)
    const messageDeleteLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!messageDeleteLog || messageDeleteLog.type != 'text' || !messageDeleteLog.viewable) 
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
    message.client.db.settings.updateMessageDeleteLogId.run(messageDeleteLog.id, message.guild.id);
    message.channel.send({embeds: [embed.addField('Message Delete Log', `${oldMessageDeleteLog} ➔ ${messageDeleteLog}`)]});
  }
};
