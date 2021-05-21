const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class WarnCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'testfarewell',
      aliases: ['testleave', 'tleave', 'tfarewell', 'tf'],
      usage: 'testfarewell',
      description: 'Sends a test farewell message.',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      userPermissions: ['KICK_MEMBERS'],
      examples: ['testfarewell']
    });
  }
  run(message, args) {
    // Send farewell message
    let { farewell_channel_id: farewellChannelId, farewell_message: farewellMessage } =
        message.client.db.settings.selectFarewells.get(message.guild.id);
    const farewellChannel = message.guild.channels.cache.get(farewellChannelId);

    if (
        farewellChannel &&
        farewellChannel.viewable &&
        farewellChannel.permissionsFor(message.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS']) &&
        farewellMessage
    ) {
      farewellMessage = farewellMessage
          .replace(/`?\?member`?/g, message.member) // Member mention substitution
          .replace(/`?\?username`?/g, message.member.user.username) // Username substitution
          .replace(/`?\?tag`?/g, message.member.user.tag) // Tag substitution
          .replace(/`?\?size`?/g, message.guild.members.cache.size); // Guild size substitution
      farewellChannel.send(new MessageEmbed().setDescription(farewellMessage).setColor("RANDOM"));
    }
    else {
      message.channel.send(new MessageEmbed()
          .setDescription(`${emojis.fail} There is no farewell message set for this server.\nTo setup a farewell message, use the following commands:\n\`setfarewellmessage\` Sets a farewell message\n\`setfarewellchannel\` Sets the channel to post the farewell message to. `)
          .setColor("RED")
          .setFooter(message.author.username, message.author.displayAvatarURL())
      )
    }
  }
};
