const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const emojis = require('../../utils/emojis.json')

module.exports = class rolesCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'roles',
      aliases: ['allroles', 'rolecount'],
      usage: 'members <role mention/ID/name>',
      description: 'Displays all the roles of the server with their member count',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['roles']
    });
  }
  async run(message, args) {
    const roleCount = message.guild.roles.cache.size
    const embed = new MessageEmbed()
        .setTitle(`Role Count`)
        .setDescription(`**TOTAL ROLES**: \`${roleCount}\`\n**REMAINING SPACE**: \`${250-roleCount}\``)
        .setFooter(`**TOTAL ROLES**: ${roleCount}`)
        .addField('**Name**', '**Members**')

    message.guild.roles.cache.sort(function (a,b){return a.members.size - b.members.size})
        .forEach(r=>{
          embed.addField(`${r}`, r.members.size)
        })

    message.channel.send(embed).catch(err => {
      return this.sendErrorMessage(message, 0, `Too much data to display.`);
    })
  }
};
