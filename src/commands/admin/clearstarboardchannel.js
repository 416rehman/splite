const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearStarboardChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearstarboardchannel',
      aliases: ['clearstc', 'cstc'],
      usage: 'clearstarboardchannel',
      description: oneLine`
        clears the starboard text channel for your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearstarboardchannel']
    });
  }
  run(message, args) {
    const starboardChannelId = message.client.db.settings.selectStarboardChannelId.pluck().get(message.guild.id);
    const oldStarboardChannel = message.guild.channels.cache.get(starboardChannelId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Starboard`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`starboard channel\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
      message.client.db.settings.updateStarboardChannelId.run(null, message.guild.id);
      return message.channel.send(embed.addField('Starboard Channel', `${oldStarboardChannel} ➔ \`None\``));

  }
};
