const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearNicknameLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearnicknamelog',
      aliases: ['clearnnl', 'cnnl'],
      usage: 'clearnicknamelog',
      description: oneLine`
        clears the nickname change log text channel for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearnicknamelog']
    });
  }
  run(message, args) {
    const nicknameLogId = message.client.db.settings.selectNicknameLogId.pluck().get(message.guild.id);
    const oldNicknameLog = message.guild.channels.cache.get(nicknameLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`nickname log\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateNicknameLogId.run(null, message.guild.id);
      return message.channel.send({embeds: [embed.addField('Nickname Log', `${oldNicknameLog} ➔ \`None\``)]});

  }
};
