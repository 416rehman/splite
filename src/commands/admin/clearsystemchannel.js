const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearSystemChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearsystemchannel',
      aliases: ['clearsc', 'csc'],
      usage: 'clearsystemchannel',
      description: oneLine`
        Clears the system text channel for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearsystemchannel']
    });
  }
  run(message, args) {
    const systemChannelId = message.client.db.settings.selectSystemChannelId.pluck().get(message.guild.id);
    const oldSystemChannel = message.guild.channels.cache.get(systemChannelId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `System`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`system channel\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateSystemChannelId.run(null, message.guild.id);
      return message.channel.send({embeds: [embed.addField('System Channel', `${oldSystemChannel} ➔ \`None\``)]});

  }
};
