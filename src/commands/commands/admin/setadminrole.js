const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../../utils/emojis.json');

module.exports = class SetAdminRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setadminrole',
      aliases: ['setar', 'sar'],
      usage: 'setadminrole <role mention/ID>',
      description: 'Sets the `admin role` for your server.\nTo clear the `admin role`, type `clearadminrole`',
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setadminrole @Admin','clearadminrole']
    });
  }
  async run(message, args) {
    const adminRoleId = message.client.db.settings.selectAdminRoleId.pluck().get(message.guild.id);
    const oldAdminRole = message.guild.roles.cache.find(r => r.id === adminRoleId) || '`None`';

    const embed = new MessageEmbed()
        .setTitle('Settings: `System`')
        .setThumbnail(message.guild.iconURL({dynamic: true}))

        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      return message.channel.send({embeds: [embed.addField('Current Admin Role', `\`${oldAdminRole}\``).setDescription(this.description)]});
    }

    // Update role
    embed.setDescription(`The \`admin role\` was successfully updated. ${success}\nTo clear the \`admin role\`, type \`clearadminrole\``)
    const adminRole = await this.getRole(message, args[0]);
    if (!adminRole) return this.sendErrorMessage(message, 0, `Failed to find that role (${args[0]}), try using a role ID`);

    message.client.db.settings.updateAdminRoleId.run(adminRole.id, message.guild.id);
    message.channel.send({embeds: [embed.addField('Admin Role', `${oldAdminRole} ➔ ${adminRole}`)]});
  }
};
