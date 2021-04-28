const Command = require('../Command.js');
const { MessageEmbed, MessageCollector } = require('discord.js');
const { confirm, deletetimeout } = require("djs-reaction-collector")
const { oneLine } = require('common-tags');
const cost = 0;
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
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    let points = message.client.db.users.selectPoints.get(message.author.id, message.guild.id)
    if (points < 10) return message.reply(`**You need ${cost-points} more points in this server to play Smash or Pass .**\n\nTo check your points, type \`${prefix}points\``)

    const potentialMatchRow = message.client.db.matches.getPotentialMatch.get(message.author.id)

    const guild = message.client.guilds.cache.get(potentialMatchRow.guild_id)
    const potentialMatchUser = guild.members.cache.get(potentialMatchRow.user_id)

    let bio = `*${potentialMatchUser.displayName} has not set a bio yet.*`
    if (potentialMatchRow.bio != null) bio = `${potentialMatchUser.displayName}'s Bio:\n${potentialMatchRow.bio}`

    const embed = new MessageEmbed()
        .setTitle(`🔥 Smash or Pass 👎`)
        .setDescription(bio)
        .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setFooter(`Expires in 10 seconds.`)

    await message.channel.send(embed).then(async msg=> {
      let stop = false;
      while (points > 10 && stop == false)
      {
        const d = new Date();
        const reactions = await confirm(msg, message.author, ["🔥", "⏹","👎"], 10000);
        if(reactions === "🔥") {
          message.client.db.users.updatePoints.run({ points: -cost }, message.author.id, message.guild.id);
          message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.id, 'yes', d.toISOString())
          msg.edit(new MessageEmbed().setTitle(`🔥 Smashed ${potentialMatchUser.displayName}`).setDescription(`Loading...`).setFooter(`Remaining Points: ${points - cost}`))
        }
        if(reactions === "👎") {
          message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.id, 'no', d.toISOString())
          msg.edit(new MessageEmbed().setTitle(`👎 Passed ${potentialMatchUser.displayName}`).setDescription(`Loading...`))
        }
        else {
          stop = true;
          msg.edit(`Stopped playing Smash or Pass!`)
        }
      }
    })
  }
};
