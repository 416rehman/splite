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
    if (optOutSmashOrPass === 1) {
      const embed = new MessageEmbed()
          .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
          .setDescription(`To use this command, you must be opted-in to ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}.\nPlease opt back in, by typing **\`${prefix}toggleSmashOrPass\`**`)
      return message.channel.send(embed)
    }

    message.guild.SmashOrPassInProgress.set(message.author.id, new Date().getTime().toString())

    let points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
    if (points < cost) {
      message.guild.SmashOrPassInProgress.delete(message.author.id)
      return await message.reply(`${emojis.nep} You need **${cost - points}** more points ${emojis.point} in this server to play ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} .\n\nTo check your points ${emojis.point}, type \`${prefix}points\``).then(m => m.delete({timeout: 15000}))
    }
    // MENTIONED A USER
    if (args.length) {
      const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0] || await message.guild.members.cache.find(m=>m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));
      if (member == undefined) {
        message.guild.SmashOrPassInProgress.delete(message.author.id)
        return message.reply(`${emojis.fail} Failed to find a user with that name, please try mentioning them or use their user ID.`).then(m=>m.delete({timeout:5000}))
      }
      if (member.user.id == message.author.id) {
        message.guild.SmashOrPassInProgress.delete(message.author.id)
        return message.reply(`${emojis.fail} No stupid, how are you gonna 🔥Smash yourself?? :neutral_face:`)
      }

      const seenBefore = message.client.db.SmashOrPass.getSeenByUser.get(message.author.id, member.user.id)
      if (seenBefore) {
        const matched = message.client.db.SmashOrPass.getMatch.get({userId: member.user.id, userId2: message.author.id})
        if (seenBefore.liked == 'yes') {
          if (matched) {
            message.guild.SmashOrPassInProgress.delete(message.author.id)
            return await message.reply(`${emojis.smashorpass} You two have matched already ${emojis.smashorpass}. To unmatch ${emojis.unmatch}, type \`${prefix}unmatch <user mention/id>\``).then(m=>m.delete({timeout: 15000}))
          }
          message.guild.SmashOrPassInProgress.delete(message.author.id)
          return message.reply(`You already voted 🔥 Smash on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``).then(m=>m.delete({timeout: 15000}))
        }
        else {
          message.guild.SmashOrPassInProgress.delete(message.author.id)
          return message.reply(`You already voted 👎 Pass on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``).then(m=>m.delete({timeout: 15000}))
        }
      }

      let bio = (message.client.db.bios.selectBio.get(member.id)).bio || `*This user has not set a bio!*`;

      const embed = new MessageEmbed()
              .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
              .setDescription(`${member.displayName} \n${bio}`)
              .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
              .setFooter(`Expires in 10 seconds ${points ? `| Points: ${points}` : ''}`)

      message.channel.send(embed).then(async msg => {
        const result = await handleSmashOrPass(msg, message.author, points, member)
        await msg.edit(new MessageEmbed()
            .setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`)
            .setDescription(result.decision)
            .setFooter(`Expires in 10 seconds | Points: ${points}`))
        await msg.reactions.removeAll();
        msg.guild.SmashOrPassInProgress.delete(message.author.id)
      })
    }
    else {
      const likedByUsers = message.client.db.SmashOrPass.getLikedByUsers.all({userId: message.author.id}) || []
      const unseenUsers = message.client.db.SmashOrPass.getUnseenUsers.all({userId: message.author.id}) || []
      const usersToBeShown = [...likedByUsers, ...unseenUsers];

      if (usersToBeShown.length) {
        usersToBeShown.reverse();
        let embed = new MessageEmbed()
            .setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`)
            .setDescription(`${emojis.load} Loading...`)
            .setFooter(`Expires in 10 seconds | Points: ${points}`)

        message.channel.send(embed).then(async msg => {
          while (points >= cost && usersToBeShown.length) {
            const currentUser = await nextUser(msg, usersToBeShown, points, prefix);
            if (currentUser) {
              let result = await handleSmashOrPass(msg, message.author, points, currentUser).catch(async e => {
                console.log(e)
                return await stopPlaying(msg, message.author.id, `${emojis.fail} An error occured`);
              })
              points = result.points;
              await msg.edit(new MessageEmbed()
                  .setTitle(result.decision)
                  .setDescription(`${emojis.load} Loading...`)
                  .setFooter(`Expires in 10 seconds | Points: ${points}`))
            }
            await msg.reactions.removeAll();
          }
          await stopPlaying(msg, message.author.id, `${emojis.fail} Maximum swipes reached per session. Try again later`);
        })
      }
      else {
        message.guild.SmashOrPassInProgress.delete(message.author.id)
        await message.reply(`You have viewed everyone. Consider resetting using the command **\`${prefix}resetsmashorpass\`**`)
      }
    }
  }
};

async function nextUser(message, usersQueue, points, prefix) {
  let currentUser;
  if (usersQueue.length) {
    const newUser = usersQueue.pop();
    const guild = message.client.guilds.cache.get(newUser.guild_id)

    if (guild) {
      currentUser = await guild.members.cache.get(newUser.user_id);
      if (currentUser) {
        let bio = (message.client.db.bios.selectBio.get(currentUser.id)).bio || `*This user has not set a bio!* Set a bio \`${prefix}bio\``;
        await message.edit(
            new MessageEmbed()
                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                .setDescription(`${currentUser.displayName} \n${bio}`)
                .setImage(currentUser.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setFooter(`Expires in 10 seconds ${points ? `| Points: ${points}` : ''} | To Opt-Out: ${prefix}optout`)
        )
      }
    }
  }
  return currentUser;
}

async function stopPlaying(msg, id, error = `${emojis.fail} Stopped Playing!`){
  msg.guild.SmashOrPassInProgress.delete(id)
  await msg.edit(new MessageEmbed().setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`).setDescription(error)).then(msg=> msg.delete({timeout: 5000}))
}

async function handleSmashOrPass(msg, author, points, currentUser){
  const date = new Date();
  const reactions = await confirm(msg, author, ["🔥", "👎"], 10000);

  let decision;
  if (reactions === '🔥') {
    try {
      decision = `🔥 Smashed ${currentUser.user.username}`
      msg.client.db.SmashOrPass.insertRow.run(author.id, currentUser.user.id, 'yes', date.toISOString())
      msg.client.db.users.updatePoints.run({points: -cost}, author.id, msg.guild.id);
      points = points - cost;
    } catch (e) {
      msg.client.db.matches.unmatchUser.run(author.id, currentUser.user.id)
      await stopPlaying(msg, author.id, `${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)
      return
    }
    const matched = await msg.client.db.SmashOrPass.getMatch.get({
      userId: currentUser.user.id,
      userId2: author.id
    })
    console.log(matched)
    try {
      if (matched) {
        await author.send(new MessageEmbed()
            .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
            .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${currentUser.user.tag}, say hi!`)
            .setImage(currentUser.user.displayAvatarURL({dynamic: true, size: 512}))
            .setFooter(`Remember to always be respectful!`))
      }
    } catch (e) { await stopPlaying(msg, author.id, `${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)}

  } else if (reactions === '👎') {
    try {
      decision = `👎 Passed ${currentUser.user.username}`
      msg.client.db.SmashOrPass.insertRow.run(author.id, currentUser.user.id, 'no', date.toISOString())
    } catch (e) { await stopPlaying(msg, author.id) }
  } else await stopPlaying(msg, author.id)

  return {decision, points}
}
