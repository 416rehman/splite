const Command = require('../Command.js');
const { oneLine, stripIndent } = require('common-tags');
const { MessageEmbed } = require('discord.js')
const emojis = require('../../utils/emojis.json')
const ReactionMenu = require('../ReactionMenu.js');

module.exports = class findStatusCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'findstatus',
      usage: 'findstatus <optional role> <text>',
      description: oneLine`
        Finds users whose status contains the provided text. If a role is provided, the search will be limited to members of that role.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['findstatus #general cool status']
    });
  }
  async run(message, args) {
    let role = this.getRoleFromMention(message, args[0]) ||
        await message.guild.roles.cache.get(args[0]) || null
    if (role) {
      args.shift();
      role = role.members
    }
    else role = message.guild.members.cache
    if(args.length <= 0) return message.reply('Please provide text to search for.')

    const query = message.content.slice(message.content.indexOf(args[0]), message.content.length);
    if (query.length > 50) return message.reply('Please provide text with less than 50 characters.')

    const embed = new MessageEmbed()
        .setDescription(`${emojis.load} **Searching for users with status **\n\`\`\`${query}\`\`\``)
    message.channel.send(embed).then(async msg=>{
      const max = 20

      let results = []
      role.forEach(m => {
        for (const activity of m.presence.activities.values()) {
          if(activity.type === 'CUSTOM_STATUS' && activity.state && activity.state.includes(query))
          {
            results.push({userID: m.id, status: activity.state})
            break;
          }
        }
      })
      results = results.map(m=> {
        return `<#${m.userID}>\n\`\`\`${m.status}\`\`\``
      })

      if (results.length <= max) {
        const range = (results.length === 1) ? '[1]' : `[1 - ${results.length}]`;
        await msg.edit(embed
            .setTitle(`Status Search Results ${range}`)
            .setDescription(results.join('\n'))
        );
      } else {
        embed
            .setTitle(`Status Search Results`)
            .setFooter(
                'Expires after two minutes.',
                message.author.displayAvatarURL({dynamic: true})
            );
        await msg.delete()
        new ReactionMenu(message.client, message.channel, message.member, embed, results, max);
      }
    })
  } 
};