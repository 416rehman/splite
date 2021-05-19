const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearModLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearmodlog',
      aliases: ['clearml', 'cml'],
      usage: 'clearmodlog',
      description: oneLine`
        clears the mod log text channel for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearmodlog']
    });
  }
  run(message, args) {
    const modLogId = message.client.db.settings.selectModLogId.pluck().get(message.guild.id);
    const oldModLog = message.guild.channels.cache.get(modLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`mod log\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateModLogId.run(null, message.guild.id);
      return message.channel.send(embed.addField('Mod Log', `${oldModLog} ➔ \`None\``));

  }
};
