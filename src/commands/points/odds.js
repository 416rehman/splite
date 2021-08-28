const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const {Voted} = require('../../utils/emojis.json')

module.exports = class WipePointsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'odds',
      aliases: ['viewodds', 'perks'],
      usage: 'odds <user mention/ID>',
      description: 'View the provided user\'s winning odds when using the gamble command.',
      type: client.types.POINTS,
      examples: ['odds @split']
    });
  }

  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id)
    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]) || message.member;
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    const modifier = (await message.client.utils.checkTopGGVote(message.client, member.id) ? 10 : 0);
    const odds = (message.client.odds.get(member.id)?.win || 55) + modifier;
    const progress = message.client.utils.createProgressBar(odds)
    const embed = new MessageEmbed()
        .setTitle('Gambling Odds')
        .setDescription(`${progress} **${odds}%** \n${member}'s gambling winning odds are: \`${odds}%\`. ${modifier ? `\n${Voted}**+10% odds** voting perk active.`:`\nBoost your gambling odds: \`${prefix}vote\``}`)
        .setFooter(modifier ? `Boost your gambling odds: ${prefix}vote`:`${Voted}**+10% odds** voting perk active.`, message.author.displayAvatarURL({dynamic: true}))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};