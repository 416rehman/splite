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
    const member = this.getMemberFromMention(message, memberArg) || message.guild.members.cache.get(memberArg) || this.getMemberFromText(message, memberArg);
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    // if (member.roles.highest.position > message.member.roles.highest.position)
    //   return this.sendErrorMessage(message, 0, 'You cannot add/remove a role from someone with higher role');
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');

    // Seperate roles by comma
    args = args.join(' ')
    args = args.split(',')
    args = args.map(arg=>{return arg.trim()})

    const changes = [];
    for (const arg of args) {
      if (arg.startsWith('+'))
      {
        const cleanedArg = arg.replace('+');
        const role = await this.getRole(message, cleanedArg);
        if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role (${cleanedArg}), try using a role ID`);
        changes.push(await this.addRole(member, role, message))
      }
      else if (arg.startsWith('-'))
      {
        const cleanedArg = arg.replace('-');
        const role = await this.getRole(message, cleanedArg);
        if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role (${cleanedArg}), try using a role ID`);
        await this.RemoveRole(member, role, message)
        changes.push(await this.RemoveRole(member, role, message))
      }
      else{
        const role = await this.getRole(message, arg);
        if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role (${arg}), try using a role ID`);
        // If member already has role remove it, else add it.
        if (member.roles.cache.has(role.id)) changes.push(await this.RemoveRole(member, role, message));
        else changes.push(await this.addRole(member, role, message));
      }
    }

    const embed = new MessageEmbed()
        .setTitle('Role')
        .setDescription(`Changed roles for ${member}.`)
        .addField('Moderator', message.member, true)
        .addField('Member', member, true)
        .addField('Role', changes.join('\n'), true)
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
    return message.channel.send(embed);

  }

  async RemoveRole(member, role, message) {
    try {
      //Remove role
      await member.roles.remove(role);
      // Update mod log
      this.sendModLogMessage(message, ' ', {Member: member, Role: role});

      return `-${role}`
    }
    catch (err) {
      message.client.logger.error(err.stack);
      return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
    }
  }

  async addRole(member, role, message) {
    try {
      // Add role
      await member.roles.add(role);
      // Update mod log
      this.sendModLogMessage(message, '', {Member: member, Role: role});

      return `+${role}`
    }
    catch (err) {
      message.client.logger.error(err.stack);
      return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
    }
  }
};