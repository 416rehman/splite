const Command = require('../Command.js');
const { MessageEmbed, MessageCollector } = require('discord.js');
const ReactionMenu = require('../ReactionMenu.js');
const { oneLine } = require('common-tags');

module.exports = class geoGuessrCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'smashorpass',
      aliases: ['sop', 'smash'],
      usage: 'smashorpass',
      description: oneLine`
        Play a game of smash or pass. You will be shown a random user and you vote smash or pass.
        If there's a match, your discord username is revealed to them.
        
        Cost: 25 points per smash
      `,
      type: client.types.FUN,
      examples: ['smashorpass', 'sop', 'smash']
    });
  }
  run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    const potentialMatchRow = message.client.db.matches.getPotentialMatch.get(message.author.id)
    console.log(potentialMatchRow.bio)

    const guild = message.client.guilds.cache.get(potentialMatchRow.guild_id)
    const potentialMatchUser = guild.members.cache.get(potentialMatchRow.user_id)
    const embed = new MessageEmbed()
        .setTitle(`🔥 Smash or Pass 👎`)
        .setDescription(`${potentialMatchUser.displayName}'s Bio:\n${potentialMatchRow.bio}`)
        .setImage(potentialMatchUser.user.avatar)
    message.reply(embed)
  }
};
