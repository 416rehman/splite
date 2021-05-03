const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { confirm } = require("djs-reaction-collector")
const { oneLine } = require('common-tags');
const emojis = require('../../utils/emojis.json')

const cost = 1000;
module.exports = class resetSmashOrPassCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'resetsmashorpass',
      aliases: ['rsop', 'rsmash', 'resetsmash'],
      usage: 'resetsmashorpass',
      description: oneLine`
        Resets all your smash or pass matches, likes, and passes.
        Start Fresh!
        
        Cost: 500 points
      `,
      type: client.types.FUN,
      examples: ['smashorpass', 'sop', 'smash']
    });
  }
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    let points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
    if (points < cost) {
      return (await message.reply(`${emojis.nep} **You need ${cost - points} more points ${emojis.point} in this server to reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history.**\n\nTo check your points ${emojis.point}, type \`${prefix}points\``)).delete({timeout: 5000})
    }
    message.reply(`Your ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} matches, likes, and passes will be reset and 500 points ${emojis.point} will be deducted from you.\nDo you want to continue?`)
        .then(async msg=>{
          const reactions = await confirm(msg, message.author, ["✅", "❎"], 30000);

          if(reactions === '✅')
          {
            message.client.db.users.updatePoints.run({points: -cost}, message.author.id, message.guild.id)
            message.client.db.users.resetSmashOrPass.run(message.author.id)
            msg.edit(`Your ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} history has been reset. Enjoy the fresh start!`)
          }
          else return;
        })
  }
};
