const Command = require('../Command.js');
const { ReactionMenu } = require('../ReactionMenu.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');
const moment = require('moment')
const emojis = require('../../utils/emojis.json')

module.exports = class MatchesCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'matches',
      aliases: ['match', 'sopmatch', 'matched'],
      usage: 'matches',
      description: oneLine`
        Displays your Smash Or Pass matches ${emojis.matches}.
      `,
      type: client.types.SMASHORPASS,
      examples: ['matches']
    });
  }
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id)
    let max = parseInt(args[0]);
    if (!max || max < 0) max = 10;
    else if (max > 25) max = 25;

    let matches, name
    if (args.length > 0) {
      const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0] || await message.guild.members.cache.find(m=>m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));
      if (member == undefined) return message.reply(`${emojis.fail} Failed to find a user with that name, please try mentioning them or use their user ID.`).then(m=>m.delete({timeout:5000}))
      matches = message.client.db.SmashOrPass.getMatches.all(member.user.id, member.user.id);
      name = member.user.username;
    }
    else {
      matches = message.client.db.SmashOrPass.getMatches.all({userId: message.author.id});
      name = message.author.username
    }

    const members = [];
    let count = 1;
    for (const row of matches) {
      const mUser = await message.client.db.users.selectRowUserOnly.get(row.shownUserID)
      const d = row.dateandtime
      members.push(oneLine`
        **${count}.** ${mUser.user_name}#${mUser.user_discriminator} - \`${moment(d).fromNow()}\`
      `);
      count++;
    }

    const embed = new MessageEmbed()
      .setFooter(
        `To start fresh, type ${prefix}resetSmashOrPass`,
        message.author.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    

    if (members.length <= max) {
      const range = (members.length == 1) ? '[1]' : `[1 - ${members.length}]`;
      message.channel.send(embed
        .setTitle(`${name}'s ${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass} Matches ${emojis.matches} ${range}`)
        .setDescription(members.join('\n'))
      );

    // Reaction Menu
    } else {
      embed
        .setTitle(`${name}'s ${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass} Matches ${emojis.matches}`)
        .setFooter(
          'Expires after two minutes.\n',
          message.author.displayAvatarURL({ dynamic: true })
        );
      
      new ReactionMenu(message.client, message.channel, message.member, embed, members, max);
    } 
  }
};
