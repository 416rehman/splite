const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ReactionMenu = require('../ReactionMenu.js');
const emojis = require('../../utils/emojis.json');
const {inPlaceSort} = require("fast-sort");

module.exports = class messageCountCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'activity',
      aliases: ['count', 'messages', 'messagecount'],
      usage: 'activity <user> / <role> / all',
      description: 'Fetches number of messages sent by users, by role, or all.',
      type: client.types.INFO,
      examples: ['activity all', 'activity @CoolRole', 'activity @split']
    });
  }
  async run(message, args) {
    const embed = new MessageEmbed()
        .setDescription(`${emojis.load} Fetching Message Count...`)
        .setColor("RANDOM")
    message.channel.send(embed).then(async msg=>
        {
          if (!args[0]) this.sendUserMessageCount(message, message.author, embed, msg);
          else if (args[0])
          {
            //All server messages
            if (args[0].toLowerCase() === 'all')
            {
              await this.sendMultipleMessageCount(args, message.guild.members.cache, message, msg, embed, `All Activity`);
            }
            else //User/Role messages
            {
              const target = this.getRoleFromMention(message, args[0]) ||
                  await message.guild.roles.cache.get(args[0]) ||
                  await this.getMemberFromMention(message, args[0]) ||
                  await message.guild.members.cache.get(args[0]) ||
                  message.author;

              switch (target.constructor.name) {
                case 'GuildMember':
                case 'User':
                  this.sendUserMessageCount(message, target, embed, msg);
                  break

                case 'Role':
                  await this.sendMultipleMessageCount(args, target.members, message, msg, embed, `${target.name}'s Activity`);
                  break
                default:
                  msg.edit(`${emojis.fail} Failed! Please try again later.`)
                  break
              }
            }
          }
        }
    )
  }

  async sendMultipleMessageCount(args, collection, message, msg, embed, title) {
    let max = parseInt(args[0]);
    if (!max || max < 0) max = 10;
    else if (max > 25) max = 25;

    const lb = [];
    await collection.forEach(m => {
      const count = message.client.db.users.selectMessageCount.pluck().get(m.id, message.guild.id);
      lb.push({user: m, count})
    });

    await inPlaceSort(lb).desc(u => u.count)

    let i = 1
    const descriptions = lb.map(e => {
      const desc = `${i} - ${e.user}: **\`${e.count}\`**`
      i++;
      return desc;
    })

    if (descriptions.length <= max) {
      const range = (descriptions.length == 1) ? '[1]' : `[1 - ${descriptions.length}]`;
      await msg.edit(embed
          .setTitle(`${title} ${range}`)
          .setDescription(descriptions.join('\n'))
      );
    } else {
      const position = lb.findIndex(p => p.user.id === message.author.id)
      embed
          .setTitle(title)
          .setFooter(
              'Expires after two minutes.\n' + `${message.member.displayName}'s position: ${position + 1}`,
              message.author.displayAvatarURL({dynamic: true})
          );
      msg.delete()
      new ReactionMenu(message.client, message.channel, message.member, embed, descriptions, max);
    }
  }

  sendUserMessageCount(message, target, embed, msg) {
    const messages = message.client.db.users.selectMessageCount.pluck().get(target.id, message.guild.id);
    embed.setDescription(`${target} has sent **${messages} messages** so far!`)
    msg.edit(embed)
  }
};
