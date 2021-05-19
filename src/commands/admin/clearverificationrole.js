const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success, verify } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class clearVerificationRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearverificationrole',
      aliases: ['clearvr', 'cvr'],
      usage: 'clearverificationrole',
      description: oneLine`
        Clears the role Splite will give members who are verified.
      `,
      type: client.types.ADMIN,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearverificationrole']
    });
  }
  async run(message, args) {
    let {
      verification_role_id: verificationRoleId,
      verification_channel_id: verificationChannelId,
      verification_message: verificationMessage,
      verification_message_id: verificationMessageId
    } = message.client.db.settings.selectVerification.get(message.guild.id);
    const oldVerificationRole = message.guild.roles.cache.get(verificationRoleId) || '`None`';
    const verificationChannel = message.guild.channels.cache.get(verificationChannelId);

    // Get status
    const oldStatus = message.client.utils.getStatus(
        verificationRoleId && verificationChannelId && verificationMessage
    );

    // Trim message
    if (verificationMessage && verificationMessage.length > 1024)
      verificationMessage = verificationMessage.slice(0, 1021) + '...';

    const embed = new MessageEmbed()
        .setTitle('Settings: `Verification`')
        .setThumbnail(message.guild.iconURL({dynamic: true}))
        .setDescription(`The \`verification role\` was successfully cleared. ${success}`)
        .addField('Channel', verificationChannel || '`None`', true)
        .addField('Message', verificationMessage || '`None`')
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);

      // Clear role
      message.client.db.settings.updateVerificationRoleId.run(null, message.guild.id);

    // Clear if no args provided
    const status = 'disabled';
    const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

    message.channel.send(embed
        .addField('Verification Role', `${oldVerificationRole} ➔ \`None\``)
        .addField('Status', `${oldStatus} ➔ \`${statusUpdate}\``))
  }
};
