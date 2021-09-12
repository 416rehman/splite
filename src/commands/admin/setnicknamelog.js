const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetNicknameLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setnicknamelog',
      aliases: ['setnnl', 'snnl'],
      usage: 'setnicknamelog <channel mention/ID>',
      description: oneLine`
        Sets the nickname change log text channel for your server. 
        \nUse \`clearnicknamelog\` to clear the current \`nickname log\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setnicknamelog #bot-log','clearnicknamelog']
    });
  }
  run(message, args) {
    const nicknameLogId = message.client.db.settings.selectNicknameLogId.pluck().get(message.guild.id);
    const oldNicknameLog = message.guild.channels.cache.get(nicknameLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send({embeds: [embed.addField('Current Nickname Log', `${oldNicknameLog}`).setDescription(this.description)]});
    }
    embed.setDescription(`The \`nickname log\` was successfully updated. ${success}\nUse \`clearnicknamelog\` to clear the current \`nickname log\`.`)
    const nicknameLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!nicknameLog || nicknameLog.type != 'text' || !nicknameLog.viewable) 
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
    message.client.db.settings.updateNicknameLogId.run(nicknameLog.id, message.guild.id);
    message.channel.send({embeds: [embed.addField('Nickname Log', `${oldNicknameLog} ➔ ${nicknameLog}`)]});
  }
};
