const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class testWelcomeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'testwelcome',
      aliases: ['testjoin', 'twelcome', 'tjoin', 'tw', 'tj'],
      usage: 'testwelcome',
      description: 'Sends a test welcome message.',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
      userPermissions: ['KICK_MEMBERS'],
      examples: ['testwelcome']
    });
  }
  run(message, args) {
    // Get welcome channel
    let { welcome_channel_id: welcomeChannelId, welcome_message: welcomeMessage } =
        message.client.db.settings.selectWelcomes.get(message.guild.id);
    const welcomeChannel = message.guild.channels.cache.get(welcomeChannelId);

    // Send welcome message
    if (
        welcomeChannel &&
        welcomeChannel.viewable &&
        welcomeChannel.permissionsFor(message.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS']) &&
        welcomeMessage
    ) {
      welcomeMessage = welcomeMessage
          .replace(/`?\?member`?/g, message.member) // Member mention substitution
          .replace(/`?\?username`?/g, message.member.user.username) // Username substitution
          .replace(/`?\?tag`?/g, message.member.user.tag) // Tag substitution
          .replace(/`?\?size`?/g, message.guild.members.cache.size); // Guild size substitution
      welcomeChannel.send(new MessageEmbed().setDescription(welcomeMessage).setColor("RANDOM"));
    }
    else {
      message.channel.send(new MessageEmbed()
          .setDescription(`${emojis.fail} There is no welcome message set for this server.\nTo setup a welcome message, use the following commands:\n\`setwelcomemessage\` Sets a welcome message\n\`setwelcomechannel\` Sets the channel to post the welcome message to. `)
          .setColor("RED")
          .setFooter(message.author.username, message.author.displayAvatarURL())
      )
    }
  }
};
