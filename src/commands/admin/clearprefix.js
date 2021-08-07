const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');

module.exports = class clearPrefixCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearprefix',
      aliases: ['clearp', 'cp'],
      usage: 'clearprefix',
      description: 'Resets the `prefix` for your server.',
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearprefix']
    });
  }
  run(message, args) {
    const oldPrefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    const defaultPrefix = '$';

    message.client.db.settings.updatePrefix.run(defaultPrefix, message.guild.id);
    message.guild.me.setNickname(`[${message.client.db.settings.selectPrefix.pluck().get(message.guild.id)}] ${message.client.name}`)
    const embed = new MessageEmbed()
      .setTitle('Settings: `System`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`prefix\` was successfully reset. ${success}`)
      .addField('Prefix', `\`${oldPrefix}\` ➔ \`${defaultPrefix}\``)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};
