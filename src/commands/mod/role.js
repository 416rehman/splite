const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class RoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'role',
      aliases: ['giverole'],
      usage: 'role <user mention/ID> <role mention/ID>',
      description: 'Adds/Removes the specified role from the provided user.',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['role @split [@role or roleName or roleID]']
    });
  }
  async run(message, args) {
    const memberArg = args.shift()
    const member = this.getMemberFromMention(message, memberArg) || message.guild.members.cache.get(memberArg);
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    // if (member.roles.highest.position > message.member.roles.highest.position)
    //   return this.sendErrorMessage(message, 0, 'You cannot add/remove a role from someone with higher role');

    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');

    let role = this.getRole(args.join(' '), message);

    if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role, try using a role ID`);
    else if (member.roles.cache.has(role.id)) // If member already has role
    {
      try {
        //Remove role
        await member.roles.remove(role);
        const embed = new MessageEmbed()
            .setTitle('Role')
            .setDescription(`${role} was successfully removed from ${member}.`)
            .addField('Moderator', message.member, true)
            .addField('Member', member, true)
            .addField('Role', role, true)
            .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send(embed);

        // Update mod log
        this.sendModLogMessage(message, reason, {Member: member, Role: role});
      } catch (err) {
        message.client.logger.error(err.stack);
        return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
      }
    }

    else {
      try {
        // Add role
        await member.roles.add(role);
        const embed = new MessageEmbed()
          .setTitle('Role')
          .setDescription(`${role} was successfully added to ${member}.`)
          .addField('Moderator', message.member, true)
          .addField('Member', member, true)
          .addField('Role', role, true)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);
        message.channel.send(embed);

        // Update mod log
        this.sendModLogMessage(message, reason, { Member: member, Role: role });

      } catch (err) {
        message.client.logger.error(err.stack);
        return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
      }
    }  
  }

  getRole(args, message) {
    if (args)
    {
      let role;
      if (args.startsWith("<@&") || (/^[0-9]{18}$/g).test(args)) role = this.getRoleFromMention(message, args) || message.guild.roles.cache.get(args);
      else role = message.guild.roles.cache.find(r => r.name.toLowerCase().startsWith(args.toLowerCase()))
      if (!role) role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.toLowerCase()))
      return role;
    }
  }
};