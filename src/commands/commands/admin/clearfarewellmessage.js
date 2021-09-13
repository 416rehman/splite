const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../../utils/emojis.json');
const { oneLine } = require('common-tags');

module.exports = class clearFarewellMessageCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearfarewellmessage',
      aliases: ['clearfarewellmsg', 'clearfm', 'cfm'],
      usage: 'clearfarewellmessage',
      description: oneLine`
        clears the message ${client.name} will say when someone leaves your server.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearfarewellmessage']
    });
  }
  run(message, args) {

    const { farewell_channel_id: farewellChannelId, farewell_message: oldFarewellMessage } = 
      message.client.db.settings.selectFarewells.get(message.guild.id);
    const farewellChannel = message.guild.channels.cache.get(farewellChannelId);
    
    // Get status
    const oldStatus = message.client.utils.getStatus(farewellChannelId, oldFarewellMessage);

    const embed = new MessageEmbed()
      .setTitle('Settings: `Farewells`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`farewell message\` was successfully cleared. ${success}`)
      .addField('Channel', farewellChannel?.toString() || '`None`', true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

      // Update status
      message.client.db.settings.updateFarewellMessage.run(null, message.guild.id);
      const status = 'disabled';
      const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

      return message.channel.send({embeds: [embed
        .addField('Status', statusUpdate, true)
        .addField('Message', '`None`')
      ]});
  }
};