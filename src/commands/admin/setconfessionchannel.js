const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class setconfessionchannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setconfessionchannel',
      aliases: ['setconfessions', 'sconfessions','setconfessionschannel'],
      usage: 'setconfessionchannel <channel mention/ID>',
      description: oneLine`
        Sets the confessions text channel for your server. This is where confessions will be sent. 
        Use \`clearconfessionschannel\` to clear the current \`confessions channel\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setconfessionchannel #general','clearconfessionchannel']
    });
  }
  run(message, args) {
    const confessionsChannelID = message.client.db.settings.selectConfessionsChannelId.pluck().get(message.guild.id);
    const oldConfessionsChannel = message.guild.channels.cache.get(confessionsChannelID) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Confessions`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send(embed.addField('Confessions Channel', `${oldConfessionsChannel}`));
    }

    embed.setDescription(`The \`confessions channel\` was successfully updated. ${success}`)
    const confessionsChannel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!confessionsChannel || (confessionsChannel.type != 'text' && confessionsChannel.type != 'news') || !confessionsChannel.viewable)
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID
      `);
    message.client.db.settings.updateConfessionsChannelId.run(confessionsChannel.id, message.guild.id);
    message.channel.send(embed.addField('Confessions Channel', `${oldConfessionsChannel} ➔ ${confessionsChannel}`));
  }
};
