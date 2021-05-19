const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearModChannelsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearmodchannels',
      aliases: ['clearmodcs', 'clearmcs', 'cmcs'],
      usage: 'clearmodchannels',
      description: oneLine`
        Clears the moderator only text channels for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearmodchannels']
    });
  }
  run(message, args) {
    const {trimArray} = message.client.utils;
    const modChannelIds = message.client.db.settings.selectModChannelIds.pluck().get(message.guild.id);
    let oldModChannels = [];
    if (modChannelIds) {
      for (const channel of modChannelIds.split(' ')) {
        oldModChannels.push(message.guild.channels.cache.get(channel));
      }
      oldModChannels = trimArray(oldModChannels).join(' ');
    }
    if (oldModChannels.length === 0) oldModChannels = '`None`';
    const embed = new MessageEmbed()
        .setTitle('Settings: `System`')
        .setThumbnail(message.guild.iconURL({dynamic: true}))
        .setDescription(`The \`mod channels\` were successfully clear. ${success}`)
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    message.client.db.settings.updateModChannelIds.run(null, message.guild.id);
    return message.channel.send(embed.addField('Mod Channels', `${oldModChannels} ➔ \`None\``));
  }
};
