const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearconfessionchannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearconfessionchannel',
      aliases: ['clearconfessions', 'cconfessions', 'clearconfessionschannel'],
      usage: 'clearconfessionchannel',
      description: oneLine`
        Clears the current \`confessions channel\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearconfessionchannel']
    });
  }
  run(message, args) {
    const confessionsChannelID = message.client.db.settings.selectConfessionsChannelId.pluck().get(message.guild.id);
    const oldConfessionsChannel = message.guild.channels.cache.get(confessionsChannelID) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Confessions`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`confessions channel\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send({embeds: [embed.addField('Confessions Channel', `\`${oldConfessionsChannel}\``)]});
    }
  }
};
