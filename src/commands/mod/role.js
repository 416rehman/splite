const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class RoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'role',
      aliases: ['giverole'],
      usage: 'role <user mention/ID> <role mention/ID>',
      description: 'Adds/Removes the specified role from the provided user.\nSeperate multiple roles with a comma ","\nUsing + at the beginning of the role adds the role but does not remove it\nUsing - at the beginning of the role removes the role but does not add it',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['role @split rolename', 'role @split rolename, +rolename2, -rolename3']
    });
  }
  async run(message, args) {
    if (!args[0]) return this.sendHelpMessage(message);
    const memberArg = args.shift()

    const member = await this.getMemberFromMention(message, memberArg) || await message.guild.members.cache.get(memberArg) || await this.getMemberFromText(message, memberArg);
    if (!member) return this.sendErrorMessage(message, 0, 'Failed to find the user. Please try again');
    let changes
    try {
      changes = await this.handleRoleAssignment(args, message, member);
    } catch (e) {
      return this.sendErrorMessage(message, 0, `Please check the role hierarchy`);
    }

    const embed = new MessageEmbed()
        .setTitle('Role')
        .setDescription(`Changed roles for ${member}.`)
        .addField('Moderator', message.member, true)
        .addField('Member', member, true)
        .addField('Roles', changes.join('\n'), true)
        .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
    return message.channel.send(embed);
  }

  async handleRoleAssignment(args, message, member) {
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a valid role to assign');
    // Seperate roles by comma
    args = args.join(' ')
    args = args.split(',')
    args = args.map(arg=>{return arg.trim()})

    const changes = [];
    for (const arg of args) {
      if (arg.startsWith('+'))
      {
        const cleanedArg = arg.replace('+', '');
        const role = await this.getRole(message, cleanedArg);
        if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role (${cleanedArg}), try using a role ID`);
        changes.push(await this.addRole(member, role, message))
      }
      else if (arg.startsWith('-'))
      {
        const cleanedArg = arg.replace('-', '');
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
    return changes;
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
    }
  }
};