const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = class MembersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'members',
      usage: 'members <role mention/ID/name>',
      description: 'Displays members with the specified role',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['members @bots', 'members 711797614697250856', 'members bots']
    });
  }
  async run(message, args) {
    let role;
    if (args[0].startsWith("<@&") || (/^[0-9]{18}$/g).test(args[0])) role = this.getRoleFromMention(message, args[0]) || message.guild.roles.cache.get(args[0]);
    else role = message.guild.roles.cache.find(r=> r.name.toLowerCase().startsWith(args[0].toLowerCase()))


    if (!role) return this.sendErrorMessage(message, 0, `Failed to find that role, try using a role ID`);
    let description;
    for (const m of role.members)
    {
      description += ` ${m.tag} `
    }
    const embed = new MessageEmbed()
        .setTitle(`Members of ${role.name}`)
        .setDescription(description)
    message.channel.send(embed)
    console.log(role.members)
  }
};
