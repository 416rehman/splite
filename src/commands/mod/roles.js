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


    try {
      message.channel.send(new MessageEmbed().setTitle(`Role count`).setDescription(`${emojis.load} Loading`)).then(
          msg=>{
            const roleCount = message.guild.roles.cache.size
            const embed = new MessageEmbed()
                .setTitle(`Role Count ${roleCount}`)
                .setDescription(`TOTAL ROLES: \`${roleCount}\`\nREMAINING SPACE: \`${250 - roleCount}\`\n\n`)
                .setFooter(`TOTAL ROLES: ${roleCount}`)


            message.guild.roles.cache.sort(function (a, b) {
              return a.members.size - b.members.size
            })
                .forEach(r => {
                  embed.addField(`${r.members.size}`, `${r}`, true)
                })

            msg.edit(embed).catch(err => {
              return this.sendErrorMessage(message, 0, `Too much data to display.`);
            })
          }
      )
    } catch (e) {
      console.log(e)
    }
  }
};
