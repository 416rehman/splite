const Command = require('../Command.js');
const ReactionMenu = require('../ReactionMenu.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');

module.exports = class MatchesCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'matches',
      aliases: ['match', 'sopmatch', 'matched'],
      usage: 'matches',
      description: oneLine`
        Displays your 🔥 Smash Or Pass 👎 matches.
      `,
      type: client.types.FUN,
      examples: ['matches']
    });
  }
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id)
    let max = parseInt(args[0]);
    if (!max || max < 0) max = 10;
    else if (max > 25) max = 25;
    let matches = message.client.db.matches.getAllMatchesOfUser.all(message.author.id);

    const members = [];
    let count = 1;
    for (const row of matches) {
      const mUser = message.client.db.users.selectRowUserOnly.get(row.shownUserID)
      members.push(oneLine`
        **${count}.** ${mUser.user_name} - \`${row.dateandtime}\`
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
        .setTitle(`🔥 Smash Or Pass 👎 Matches ${range}`)
        .setDescription(members.join('\n'))
      );

    // Reaction Menu
    } else {

      embed
        .setTitle('🔥 Smash Or Pass 👎 Matches')
        .setFooter(
          'Expires after two minutes.\n',
          message.author.displayAvatarURL({ dynamic: true })
        );
      
      new ReactionMenu(message.client, message.channel, message.member, embed, members, max);

    } 
  }
};
