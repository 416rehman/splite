const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine } = require('common-tags');

module.exports = class clearAutoRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearautorole',
      aliases: ['clearaur', 'caur'],
      usage: 'clearautorole',
      description: oneLine`
        clears the current \`auto role\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearautorole']
    });
  }
  run(message, args) {
    const autoRoleId = message.client.db.settings.selectAutoRoleId.pluck().get(message.guild.id);
    const oldAutoRole = message.guild.roles.cache.find(r => r.id === autoRoleId) || '`None`';

    const embed = new MessageEmbed()
      .setTitle('Settings: `System`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`auto role\` was successfully cleared. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

      message.client.db.settings.updateAutoRoleId.run(null, message.guild.id);
      message.channel.send({embeds: [embed.addField('Auto Role', `${oldAutoRole}`)]});
  }
};
