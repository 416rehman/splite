const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success, verify } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetViewConfessionsRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setviewconfessionsrole',
      aliases: ['setvcr', 'svcr'],
      usage: 'setviewconfessionsrole <role mention/ID>',
      description: oneLine`
        Sets the role whose members can use /view command to view details about a confession.
      `,
      type: client.types.ADMIN,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setviewconfessionsrole @admins']
    });
  }
  async run(message, args) {
    let { 
      view_confessions_role: view_confessions_role
    } = message.client.db.settings.selectViewConfessionsRole.get(message.guild.id);
    const oldViewConfessionsRole = message.guild.roles.cache.get(view_confessions_role) || '`None`';
    
    // Get status
    const oldStatus = message.client.utils.getStatus(oldViewConfessionsRole);

    const embed = new MessageEmbed()
      .setTitle('Settings: `Confessions`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`view confessions role\` was successfully updated. ${success}`)
      .addField('Role', oldViewConfessionsRole || '`None`', true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear role
    if (args.length === 0) {
      message.client.db.settings.updateViewConfessionsRole.run(0, message.guild.id);
      
      // Update status
      const status = 'disabled';
      const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``; 

      return message.channel.send(embed
        .spliceFields(0, 0, { name: 'Role', value: `${oldViewConfessionsRole} ➔ \`None\``, inline: true })
        .spliceFields(2, 0, { name: 'Status', value: statusUpdate, inline: true })
      );
    }

    // Update role
    const confessionsRole = message.guild.roles.cache.get(args[0]);
    if (!confessionsRole) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');
    message.client.db.settings.updateViewConfessionsRole.run(confessionsRole.id, message.guild.id);

    // Update status
    const status =  message.client.utils.getStatus(confessionsRole);
    const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

    message.channel.send(embed
      .spliceFields(0, 0, { name: 'Role', value: `${oldViewConfessionsRole} ➔ ${confessionsRole}`, inline: true })
      .spliceFields(2, 0, { name: 'Status', value: statusUpdate, inline: true })
    );
  }
};
