const Command = require('../Command.js');
const { MessageEmbed, MessageCollector } = require('discord.js');
const { confirm, deletetimeout } = require("djs-reaction-collector")
const { oneLine } = require('common-tags');
const cost = 10;
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
    let points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
    if (points < 10) return (await message.reply(`**You need ${cost - points} more points in this server to play 🔥 Smash or Pass 👎 .**\n\nTo check your points, type \`${prefix}points\``)).delete({timeout: 5000})

    if (args[0] == null || args[0] == undefined)
    {
      let potentialMatchRow = message.client.db.matches.getPotentialMatch.get(message.author.id, message.author.id)

      let guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
      let potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)

      let bio = `*${potentialMatchUser.user.username} has not set a bio yet.*`
      if (potentialMatchRow.bio != null) bio = `${potentialMatchUser.user.username}'s Bio:\n${potentialMatchRow.bio}`

      let embed = new MessageEmbed()
          .setTitle(`🔥 Smash or Pass 👎`)
          .setDescription(bio)
          .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setFooter(`Expires in 10 seconds | Points: ${points}`)

      await message.channel.send(embed).then(async msg=> {
        console.log(points)
        while (points > cost)
        {
          const d = new Date();
          const reactions = await confirm(msg, message.author, ["🔥", "👎"], 10000);

          if(reactions === '🔥') {
            console.log('fire')
            message.client.db.users.updatePoints.run({ points: -cost }, message.author.id, message.guild.id);
            message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.user.id, 'yes', d.toISOString())
            points = points - cost
            const matched = message.client.db.matches.getMatch(message.author.id, potentialMatchUser.user.id)
            if (matched != null || matched != undefined)
            {
              message.author.send(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\nYou matched with ${potentialMatchUser.user.tag}, say hi to them!`).setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 })).setFooter(`Remember to always be respectful!`))
                  .catch(err=>msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)).setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 })))
              msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\n${potentialMatchUser.user.username}'s tag has been dmed to you.`).setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 })))
            }
            msg.edit(new MessageEmbed().setTitle(`🔥 Smashed ${potentialMatchUser.user.username}`).setDescription(`Loading...`).setFooter(`Expires in 10 seconds | Points: ${points}`))
            potentialMatchUser.user.send(`You just received a 🔥 Smash on **🔥 Smash or Pass 👎**. Play now to see if it's a match`).catch(err => console.log(err))
            if (points < cost) break;
          }
          else if(reactions === '👎') {
            message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.id, 'no', d.toISOString())
            msg.edit(new MessageEmbed().setTitle(`👎 Passed ${potentialMatchUser.user.username}`).setDescription(`Loading...`).setFooter(`Expires in 10 seconds | Points: ${points}`))
          }
          else {
            msg.edit(`Stopped playing Smash or Pass!`, {embed: null})
            return;
          }

          msg.reactions.removeAll();
          potentialMatchRow = message.client.db.matches.getPotentialMatch.get(message.author.id, message.author.id)

          guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
          potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)
          bio = `*${potentialMatchUser.user.username} has not set a bio yet.*`
          if (potentialMatchRow.bio != null) bio = `${potentialMatchUser.user.username}'s Bio:\n${potentialMatchRow.bio}`

          embed = new MessageEmbed()
              .setTitle(`🔥 Smash or Pass 👎`)
              .setDescription(bio)
              .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
              .setFooter(`Expires in 10 seconds | Points: ${points}`)
          msg.edit(embed)
        }
        if (points < cost)
        {
          return msg.edit(`**You need ${cost - points} more points in this server to play Smash or Pass .**\n\nTo check your points, type \`${prefix}points\``, {embed: null}).then(m => m.delete({timeout: 5000}))
        }
      })
    }
    else
    {
      const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0] || message.guild.members.cache.find(m=>m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));

      const row = message.client.db.matches.getSeenByUser.get(message.author.id, member.user.id)
      if (row != null || row !== undefined)
      {
        if (row.liked == 'yes')
        {
          const row2 = message.client.db.matches.getMatch.get(message.author.id, member.user.id)
          if (row2 != null || row2 !== undefined) return message.reply(`🔥 You two have matched already 🔥. To unmatch, type \`${prefix}unmatch <user mention/id>\``);
          return message.reply(`You already voted 🔥 Smash on ${member.user.username}. To reset your Smash or Pass history, type \`${prefix}resetSmashOrPass\``);
        }
        return message.reply(`You already voted 👎 Pass on ${member.user.username}. To reset your Smash or Pass history, type \`${prefix}resetSmashOrPass\``)
      }

      let {
        bio: Bio
      } = message.client.db.users.selectBio.get(message.guild.id, member.user.id);

      let bio = `*${member.user.username} has not set a bio yet.*`
      if (Bio != null) bio = `${member.user.username}'s Bio:\n${Bio}`

      let embed = new MessageEmbed()
          .setTitle(`🔥 Smash or Pass 👎`)
          .setDescription(bio)
          .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setFooter(`Expires in 10 seconds | Points: ${points}`)

      message.channel.send(embed).then(async msg=>{
        const d = new Date();
        const reactions = await confirm(msg, message.author, ["🔥", "👎"], 10000);

        if(reactions === '🔥') {
          message.client.db.users.updatePoints.run({ points: -cost }, message.author.id, message.guild.id);
          message.client.db.matches.insertRow.run(message.author.id, member.user.id, 'yes', d.toISOString())
          points = points - cost
          const matched = message.client.db.matches.getMatch.get(message.author.id, member.user.id)
          if (matched != null || matched != undefined)
          {
            message.author.send(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\nYou matched with ${member.user.tag}, say hi to them!`).setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })).setFooter(`Remember to always be respectful!`))
                .catch(err=>msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)).setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })))
            msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`🔥🔥 **IT'S A MATCH** 🔥🔥\n${member.user.username}'s tag has been dmed to you.`).setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })))
          }
          msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`You voted 🔥 Smash on ${member.user.username}`).setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })))
          member.user.send(`You just received a 🔥 Smash on **🔥 Smash or Pass 👎**. Play now to see if it's a match`).catch(err => console.log(err))
        }
        else if(reactions === '👎') {
          message.client.db.matches.insertRow.run(message.author.id, member.user.id, 'no', d.toISOString())
          msg.edit(new MessageEmbed().setTitle(`🔥 Smash or Pass 👎`).setDescription(`You voted 👎 Pass on ${member.user.username}`).setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })))
        }
      })
    }
  }
};
