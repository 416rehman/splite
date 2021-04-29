const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');

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
    const q = "🎲 🎲 🎲 🎲 🎲"
    console.log(q)
    console.log(q.length)
    const p = "abcde"
    console.log(p)
    console.log(p.length)
    // message.channel.send(new MessageEmbed()
    //     .setTitle(`${message.author.username} Gambling ${amount} points`)
    //     .setDescription(`**Rolling**\n🎲 🎲 🎲 🎲 🎲`))
    //     .then(msg=>{
    //       setInterval(()=>{
    //
    //       }, 1000)
    //     })
    // const d = Math.random();
    // //Loss 55% chance
    // if (d < 0.55)
    // {
    //   message.client.db.users.updatePoints.run({ points: -amount }, message.author.id, message.guild.id);
    // }
    // //Win 45% chance
    // else
    // {
    //   message.client.db.users.updatePoints.run({ points: amount }, member.id, message.guild.id);
    // }
    // // Remove points
    // message.client.db.users.updatePoints.run({ points: -amount }, message.author.id, message.guild.id);
    // // Add points
    // const oldPoints = message.client.db.users.selectPoints.pluck().get(member.id, message.guild.id);
    // message.client.db.users.updatePoints.run({ points: amount }, member.id, message.guild.id);
    // let description;
    // if (amount === 1) description = `Successfully transferred **${amount}** point to ${member}!`;
    // else description = `Successfully transferred **${amount}** points to ${member}!`;
    // const embed = new MessageEmbed()
    //   .setTitle(`${member.displayName}'s Points`)
    //   .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    //   .setDescription(description)
    //   .addField('From', message.member, true)
    //   .addField('To', member, true)
    //   .addField('Points', `\`${oldPoints}\` ➔ \`${amount + oldPoints}\``, true)
    //   .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
    //   .setTimestamp()
    //   .setColor(member.displayHexColor);
    // message.channel.send(embed);
  }
};
