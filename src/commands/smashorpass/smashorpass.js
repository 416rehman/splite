//THIS IS SOOOO MESSY
// but it works
const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { confirm } = require("djs-reaction-collector")
const { oneLine } = require('common-tags');
const emojis = require('../../utils/emojis.json')
const cost = 5;
module.exports = class smashOrPassCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'smashorpass',
      aliases: ['sop', 'smash'],
      usage: 'smashorpass [<user mention/id>]',
      description: oneLine`
        Play a game of smash or pass. You will be shown a random user and you vote smash or pass.
        If there's a match, your discord username is revealed to them.
        
        If a user is mentioned, you will be asked to vote for them.        
        
        Cost: 5 points per smash
        To opt-out of the game, use the command "toggleSmashOrPass"
      `,
      type: client.types.SMASHORPASS,
      examples: ['smashorpass', 'sop', 'smash'],
      clientPermissions: ['MANAGE_MESSAGES','SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS']
    });
  }
  async run(message, args) {
    if (message.guild.SmashOrPassInProgress.has(message.author.id)) return message.reply(`${emojis.fail} You are already playing. Please try again later`)
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    const optOutSmashOrPass = message.client.db.users.selectOptOutSmashOrPass.pluck().get(message.author.id)
    if (optOutSmashOrPass === 1)
    {
      const embed = new MessageEmbed()
          .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
          .setDescription(`To use this command, you must be opted-in to ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}.\nPlease opt back in, by typing **\`${prefix}toggleSmashOrPass\`**`)
      return message.channel.send(embed)
    }

    message.guild.SmashOrPassInProgress.set(message.author.id, new Date().getTime().toString())

    let points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
    if (points < cost) {
      message.guild.SmashOrPassInProgress.delete(message.author.id)
      return await message.reply(`${emojis.nep} You need **${cost - points}** more points ${emojis.point} in this server to play ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} .\n\nTo check your points ${emojis.point}, type \`${prefix}points\``).then(m=>m.delete({timeout: 15000}))
    }
    const suggested = message.client.db.matches.getSuggestedUsers.all(message.author.id,message.author.id)
    const NumOfSuggestions = suggested.length;
    console.log(suggested)
    console.log({NumOfSuggestions})
    let x = 0;
    if (args[0] == null || args[0] === undefined)
    {
      let potentialMatchUser, guild, potentialMatchRow
      if (suggested.length > 0)
      {
        potentialMatchRow = await message.client.db.users.selectRowUserOnly.get(suggested[0].userID)
        console.log(potentialMatchRow)
        guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
        potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)
        x++;
      }
      else
      {
        potentialMatchRow = await message.client.db.matches.getPotentialMatch.get(message.author.id, message.author.id)
        let i = 0;
        do {
          guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
          potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)
          i++;
          if (i > 50)
          {
            message.guild.SmashOrPassInProgress.delete(message.author.id)
            return message.reply(`${emojis.fail} Please try again later!`).then(m=>m.delete({timeout: 5000}))
          }
        } while (potentialMatchUser === undefined)
      }

      let bio = `*${potentialMatchUser.user.username} has not set a bio yet. Use \`${prefix}bio\` to set one*`
      if (potentialMatchRow.bio != null) bio = `${potentialMatchUser.user.username}'s Bio:\n${potentialMatchRow.bio}`

      let embed = new MessageEmbed()
          .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
          .setDescription(bio)
          .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setFooter(`Expires in 10 seconds | Points: ${points}`)

      await message.channel.send(embed).then(async msg=> {

        while (points > cost)
        {
          const d = new Date();
          const reactions = await confirm(msg, message.author, ["🔥", "👎"], 10000);

          if(reactions === '🔥') {
            message.client.db.users.updatePoints.run({ points: -cost }, message.author.id, message.guild.id);
            message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.user.id, 'yes', d.toISOString())
            points = points - cost
            const matched = await message.client.db.matches.getMatch.get(message.author.id, potentialMatchUser.user.id, potentialMatchUser.user.id)
            console.log(matched)
            if (matched != null)
            {
              try{
                await message.author.send(new MessageEmbed()
                    .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                    .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${potentialMatchUser.user.tag}, say hi!`)
                    .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter(`Remember to always be respectful!`))
                await potentialMatchUser.user.send(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${message.author.tag}, say hi!`).setImage(message.author.displayAvatarURL({ dynamic: true, size: 512 })).setFooter(`Remember to always be respectful!`))
                await msg.edit(new MessageEmbed()
                    .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                    .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\n${potentialMatchUser.user.username}'s tag has been dmed to you.`)
                    .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 })))
              }
              catch(err)
              {
                message.guild.SmashOrPassInProgress.delete(message.author.id)
                if (err)
                {
                  await msg.edit(new MessageEmbed()
                      .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                      .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)
                      .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
                  )
                }
              }
            }
            await msg.edit(new MessageEmbed()
                .setTitle(`🔥 Smashed ${potentialMatchUser.user.username}`)
                .setDescription(`${emojis.load} Loading...`)
                .setFooter(`Expires in 10 seconds | Points: ${points}`)
            )

            if (points < cost)
            {
              message.guild.SmashOrPassInProgress.delete(message.author.id)
              break;
            }
          }
          else if(reactions === '👎') {
            message.client.db.matches.insertRow.run(message.author.id, potentialMatchUser.id, 'no', d.toISOString())
            await msg.edit(new MessageEmbed().setTitle(`👎 Passed ${potentialMatchUser.user.username}`).setDescription(`${emojis.load} Loading...`).setFooter(`Expires in 10 seconds | Points: ${points}`))
          }
          else {
            message.guild.SmashOrPassInProgress.delete(message.author.id)
            await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`).setDescription(`${emojis.fail} Stopped Playing!`)).then(msg=> msg.delete({timeout: 5000}))
            return;
          }

          await msg.reactions.removeAll();
          if (x < NumOfSuggestions)
          {
            potentialMatchRow = await message.client.db.users.selectRowUserOnly.get(suggested[x].userID)
            guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
            potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)
            x++;
          }
          else
          {
            let i = 0;
            do {
              potentialMatchRow = await message.client.db.matches.getPotentialMatch.get(message.author.id, message.author.id)
              guild = await message.client.guilds.cache.get(potentialMatchRow.guild_id)
              potentialMatchUser = await guild.members.cache.get(potentialMatchRow.user_id)
              i++;
              if (i > 100)
              {
                console.log('Exceeded 100 loops')
                message.guild.SmashOrPassInProgress.delete(message.author.id)
                return msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`).setDescription(`${emojis.fail} Please try again later!`)).then(m=>m.delete({timeout: 5000}))
              }
            } while (potentialMatchUser === undefined || potentialMatchUser == null)
            i = 0;
          }

          bio = `*${potentialMatchUser.user.username} has not set a bio yet. Use \`${prefix}bio\` to set one.*`
          if (potentialMatchRow.bio != null) bio = `${potentialMatchUser.user.username}'s Bio:\n${potentialMatchRow.bio}`

          embed = new MessageEmbed()
              .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
              .setDescription(bio)
              .setImage(potentialMatchUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
              .setFooter(`Expires in 10 seconds | Points: ${points}`)
          await msg.edit(embed)
        }
        if (points < cost)
        {
          message.guild.SmashOrPassInProgress.delete(message.author.id)
          return msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`).setDescription(`${emojis.nep} You need **${cost - points}** more points ${emojis.point} in this server to play ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} .\n\nTo check your points ${emojis.point}, type \`${prefix}points\``)).then(m => m.delete({timeout: 15000}))
        }
      })
    }
    // MENTIONED A USER
    else
    {
      const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0] || await message.guild.members.cache.find(m=>m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));
      if (member == undefined) return message.reply(`${emojis.fail} Failed to find a user with that name, please try mentioning them or use their user ID.`).then(m=>m.delete({timeout:5000}))
      if (member.user.id == message.author.id)
      {
        message.guild.SmashOrPassInProgress.delete(message.author.id)
        return message.reply(`${emojis.fail} No stupid, how are you gonna 🔥Smash yourself??`)
      }
      const row = message.client.db.matches.getSeenByUser.get(message.author.id, member.user.id)
      if (row != null || row !== undefined)
      {
        if (row.liked === 'yes')
        {
          const row2 = message.client.db.matches.getMatch.get(message.author.id, member.user.id, member.user.id)
          if (row2 != null || row2 !== undefined) {
            message.guild.SmashOrPassInProgress.delete(message.author.id)
            return await message.reply(`${emojis.smashorpass} You two have matched already ${emojis.smashorpass}. To unmatch ${emojis.unmatch}, type \`${prefix}unmatch <user mention/id>\``).then(m=>m.delete({timeout: 15000}))
          }
          message.guild.SmashOrPassInProgress.delete(message.author.id)
          return message.reply(`You already voted 🔥 Smash on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``).then(m=>m.delete({timeout: 15000}))
        }
        message.guild.SmashOrPassInProgress.delete(message.author.id)
        return message.reply(`You already voted 👎 Pass on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``).then(m=>m.delete({timeout: 15000}))
      }

      let {
        bio: Bio
      } = message.client.db.bios.selectBio.get(member.user.id);

      let bio = `*${member.user.username} has not set a bio yet. Use \`${prefix}bio\` to set one*`
      if (Bio != null) bio = `${member.user.username}'s Bio:\n${Bio}`

      let embed = new MessageEmbed()
          .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
          .setDescription(bio)
          .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setFooter(`Expires in 10 seconds | Points: ${points}`)

      message.channel.send(embed).then(async msg=>{
        const d = new Date();
        const reactions = await confirm(msg, message.author, ["🔥", "👎"], 10000);

        if(reactions === '🔥')
        {
          await message.client.db.users.updatePoints.run({ points: -cost }, message.author.id, message.guild.id);
          await message.client.db.matches.insertRow.run(message.author.id, member.user.id, 'yes', d.toISOString())
          points = points - cost
          const matched = message.client.db.matches.getMatch.get(message.author.id, member.user.id, member.user.id)

          if (matched != null)
          {
            try
            {
              await message.author.send(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${member.user.tag}, say hi!`).setImage(member.user.displayAvatarURL({
                dynamic: true,
                size: 512
              })).setFooter(`Remember to always be respectful!`))
              await member.user.send(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${message.author.tag}, say hi!`).setImage(message.author.displayAvatarURL({
                dynamic: true,
                size: 512
              })).setFooter(`Remember to always be respectful!`))
              await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\n${member.user.username}'s tag has been dmed to you.`).setImage(member.user.displayAvatarURL({
                dynamic: true,
                size: 512
              }))).then(m=>m.delete({timeout: 10000}))
            }
            catch (e) {
              console.log(e)
              message.guild.SmashOrPassInProgress.delete(message.author.id)
              await msg.edit(new MessageEmbed()
                  .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                  .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)
                  .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
              )
            }
          }
          await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`You voted 🔥 Smash on ${member.user.username}`).setImage(member.user.displayAvatarURL({
            dynamic: true,
            size: 512
          })))
          // member.user.send(new MessageEmbed()
          //     .setTitle(`🔥 Smash or Pass 👎`)
          //     .setDescription(`You just received a 🔥 Smash on **🔥 Smash or Pass 👎**. Play now using the command \`smashOrPass\` in **${message.guild.name}** to see if it's a match`)
          //     .setFooter(`To opt-out of the game, use the command "toggleSmashOrPass"`)).catch(err => console.log(err))
        }
        else if(reactions === '👎')
        {
          message.client.db.matches.insertRow.run(message.author.id, member.user.id, 'no', d.toISOString())
          (await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`You voted 👎 Pass on ${member.user.username}`).setImage(member.user.displayAvatarURL({
            dynamic: true,
            size: 512
          }))))
        }
        else
        {
          message.guild.SmashOrPassInProgress.delete(message.author.id)
          await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`).setDescription(`${emojis.fail} Stopped Playing!`)).then(msg=> msg.delete({timeout: 5000}))
          return;
        }
      })
      message.guild.SmashOrPassInProgress.delete(message.author.id)
    }
  }
};
