const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const emojis = require('../../utils/emojis.json')

const limit = 1000;

module.exports = class gambleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'gamble',
      aliases: ['spin', 'coinflip', 'heads', 'tails', 'roll'],
      usage: 'gamble <point count>',
      description: 'Gamble your points. Limit: 1000',
      type: client.types.POINTS,
      examples: ['gamble 1000']
    });
  }
  run(message, args) {
    if (message.guild.betsInProgress.has(message.author.id)) return message.reply(`${emojis.fail} You are already gambling. Please try again later`)
    const amount = parseInt(args[0]);
    const points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id);
    if (isNaN(amount) === true || !amount)
      return this.sendErrorMessage(message, 0, `${emojis.fail} Please provide a valid point count`);
    if (amount < 0 || amount > points) return message.reply(`${emojis.nep} Please provide an amount you currently have! You have ${points} points ${emojis.point}`);
    if (amount > limit) return message.reply(`${emojis.fail} You can't bet more than ${limit} points ${emojis.point} at a time. Please try again!`);

    message.guild.gamblesInProgress.add(message.author.id)

    const embed = new MessageEmbed()
        .setTitle(`${message.author.username} gambling ${amount} points ${emojis.point}`)
        .setDescription(`${emojis.point} **Rolling** ${emojis.point}\n${emojis.dices}${emojis.dices}${emojis.dices}`)
        .setFooter(`Your points: ${points}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(embed).then(msg => {
          setTimeout(()=>{
              msg.edit(embed.setDescription(`**Rolling**`))
              const d = weightedRandom({0:50, 1:50})
              //Loss
              if (d == 0)
              {
                const embed = new MessageEmbed()
                    .setTitle(`${message.author.username} gambling ${amount} Points ${emojis.point}`)
                    .setDescription(`${fail} You lost! **Remaining Points **${emojis.point} **: ${points - amount}**`)
                    .setFooter(`Your points: ${points - amount}`, message.author.displayAvatarURL({ dynamic: true }))
                message.client.db.users.updatePoints.run({ points: -amount }, message.author.id, message.guild.id);
                msg.edit(embed)
              }
              //Win
              else
              {
                const embed = new MessageEmbed()
                    .setTitle(`${message.author.username} gambling ${amount} Points ${emojis.point}`)
                    .setDescription(`🎉 You Won! **Your points **${emojis.point} **: ${points + amount}**`)
                    .setFooter(`Your points: ${points + amount}`, message.author.displayAvatarURL({ dynamic: true }))
                message.client.db.users.updatePoints.run({ points: amount }, message.author.id, message.guild.id);
                msg.edit(embed)
              }
          }, 1000)
        }).catch(e=>{console.log(e)})
    message.guild.gamblesInProgress.delete(message.author.id)
  }
};

function weightedRandom(input) {
  const array = []; // Just Checking...
  for(let item in input) {
    if ( input.hasOwnProperty(item) ) { // Safety
      for( let i=0; i<input[item]; i++ ) {
        array.push(item);
      }
    }
  }
  // Probability Fun
  return array[Math.floor(Math.random() * array.length)];
}
