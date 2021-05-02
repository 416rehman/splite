const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const { confirm } = require("djs-reaction-collector")
const { fail } = require('../../utils/emojis.json')

const limit = 1000;

module.exports = class betCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'bet',
      usage: 'bet <user mention/id/name> <point count>',
      description: 'Bet against someone. Winner receives double the bet amount',
      type: client.types.POINTS,
      examples: ['bet @split 1000']
    });
  }
  run(message, args)
  {
    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (member.id === message.client.user.id)
      return message.channel.send('Sorry I am not allowed to play with you 😟');

    let amount = parseInt(args[1]);
    if (isNaN(amount) === true || !amount)
      return this.sendErrorMessage(message, 0, 'Please provide a valid point count');

    const points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id);
    const otherPoints = message.client.db.users.selectPoints.pluck().get(member.user.id, message.guild.id);

    if (amount < 0 || amount > points) return message.reply(`Please provide an amount you currently have! You have ${points} points`);
    if (amount > limit) amount = limit;
    if (amount < 0 || amount > otherPoints) return message.reply(`${member.user.username} only has ${otherPoints} points! Please change your betting amount!`);

    message.channel.send(`${member}, ${message.author.username} has sent you a bet of ${amount} points 💰. Do you accept?`).then(async msg =>
    {
      const reactions = await confirm(msg, member, ["✅", "❎"], 30000);
      if (reactions === '✅')
      {
        const embed = new MessageEmbed()
            .setTitle(`${message.author.username} VS ${member.user.username}`)
            .setDescription(`💰 **Rolling for ${amount} points** 💰`)
            .setFooter(`${message.author.username} points: ${points} | ${member.user.username} points: ${otherPoints}`)

        message.channel.send(embed).then(msg => {
          const progress = "🃏 🃏 🃏".split(' ')
          const inter = setInterval(()=>{
            if (progress.length > 0)
            {
              msg.edit(embed.setDescription(`💰 **Rolling for ${amount} points** 💰\n${progress.join(" ")}`))
              progress.pop()
            }
            else
            {
              msg.edit(embed.setDescription(`💰 **Rolling for ${amount} points** 💰`))
              const d = weightedRandom({0:50, 1:50})
              const winner = d ? member : message.author;
              const loser = winner == member ? message.author : member;

              message.client.db.users.updatePoints.run({ points: -amount }, loser.user.id, message.guild.id);
              message.client.db.users.updatePoints.run({ points: amount }, winner.user.id, message.guild.id);

              const embed = new MessageEmbed()
                  .setTitle(`${message.author.username} VS ${member.user.username}`)
                  .setDescription(`🎉 ${winner} has won ${amount} points from ${loser}! 💰`)
                  .setFooter(`🏆 ${winner}'s points: ${points + amount} | ${loser}'s points: ${otherPoints - amount}`)
              msg.edit(embed)

              clearInterval(inter)
            }
          }, 1000)
        }).catch(e=>{console.log(e)})
      }
      else
      {
        msg.edit(`${fail} ${message.author}, ${member.user.username} has rejected your bet!`)
      }
    })
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
