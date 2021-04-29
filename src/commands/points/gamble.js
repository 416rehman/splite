const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const { fail } = require('../../utils/emojis.json')

const limit = 1000;

module.exports = class gambleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'gamble',
      aliases: ['spin', 'coinflip', 'heads', 'tails', 'roll', 'bet'],
      usage: 'gamble <point count>',
      description: 'Gamble your points. Limit: 1000',
      type: client.types.POINTS,
      examples: ['gamble 1000']
    });
  }
  run(message, args) {
    const amount = parseInt(args[0]);
    const points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id);
    if (isNaN(amount) === true || !amount)
      return this.sendErrorMessage(message, 0, 'Please provide a valid point count');
    if (amount < 0 || amount > points) return message.reply(`Please provide an amount you currently have! You have ${points}`);
    if (amount > limit) return message.reply(`You can't bet more than ${limit} at a time. Please try again!`);

    const progress = "🎲 🎲 🎲 🎲 🎲".split(' ')
    const embed = new MessageEmbed()
        .setTitle(`${message.author.username} Gambling ${amount} points`)
        .setDescription(`**Rolling**`)

    message.channel.send(embed).then(msg => {
          const inter = setInterval(()=>{
            if (progress.length > 0)
              msg.edit(embed.setDescription(`**Rolling**\n${progress.join(" ")}`)).then(r => progress.pop())
            else
            {
              msg.edit(embed.setDescription(`**Rolling**\n${progress.join(" ")}`))
              const d = Math.random();
              //Loss
              if (d < 0.7)
              {
                const embed = new MessageEmbed()
                    .setTitle(`${message.author.username} Gambling ${amount} points`)
                    .setDescription(`${fail} You lost! **Remaining points: ${points - amount}**🪙`)
                message.client.db.users.updatePoints.run({ points: -amount }, message.author.id, message.guild.id);
                msg.edit(embed)
              }
              //Win
              else
              {
                const embed = new MessageEmbed()
                    .setTitle(`${message.author.username} Gambling ${amount} points`)
                    .setDescription(`🎉 You Won! **Your points: ${points + amount}**🪙`)
                message.client.db.users.updatePoints.run({ points: amount }, message.author.id, message.guild.id);
                msg.edit(embed)
              }
              clearInterval(inter)
            }
          }, 1000)
        }).catch(e=>{console.log(e)})
  }
};
