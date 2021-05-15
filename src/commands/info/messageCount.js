const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const emojis = require('../../utils/emojis.json');
const {inPlaceSort} = require("fast-sort");
const { stripIndent } = require('common-tags');

module.exports = class messageCountCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'messagecount',
      aliases: ['count', 'messages', 'activity'],
      usage: 'messageCount',
      description: 'Fetches number of messages sent by users.',
      type: client.types.INFO,
      examples: ['messageCount @splite', 'messageCount @CoolRole']
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
                  const lb = [];

                  await target.members.forEach(m=>{
                    const count = message.client.db.users.selectMessageCount.pluck().get(m.id, message.guild.id);
                    lb.push({id: m.id, count})
                  });
                  await inPlaceSort(lb).desc(u=>u.count)
                    console.log(lb)
                  break

                default:
                  break
              }
            }
          }
        }
    )
  }

  sendUserMessageCount(message, target, embed, msg) {
    const messages = message.client.db.users.selectMessageCount.pluck().get(target.id, message.guild.id);
    embed.setDescription(`${target} has sent **${messages} messages** so far!`)
    msg.edit(embed)
  }
};
