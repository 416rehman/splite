const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../../utils/emojis.json');

module.exports = class ClearAdminRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearadminrole',
      aliases: ['clearar', 'car'],
      usage: 'clearadminrole',
      description: 'Clears the `admin role` for your server.',
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearadminrole']
    });
  }
  run(message, args) {
    const adminRoleId = message.client.db.settings.selectAdminRoleId.pluck().get(message.guild.id);
    const oldAdminRole = message.guild.roles.cache.find(r => r.id === adminRoleId) || '`None`';

    const embed = new MessageEmbed()
        .setTitle('Settings: `System`')
        .setThumbnail(message.guild.iconURL({dynamic: true}))
        .setDescription(`The \`admin role\` was successfully cleared. ${success}`)
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);

    message.client.db.settings.updateAdminRoleId.run(null, message.guild.id);
    return message.channel.send({embeds: [embed.addField('Admin Role', `${oldAdminRole} ➔ \`None\``)]});
  }
};
