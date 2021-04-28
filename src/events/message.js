const { MessageEmbed } = require('discord.js');
const { online, dnd } = require('../utils/emojis.json')
const moment = require('moment')
const { oneLine } = require('common-tags');

module.exports = (client, message) => {
  if (message.channel.type === 'dm' || !message.channel.viewable || message.author.bot) return;

  const {
    afk: currentStatus
  } = message.client.db.users.selectAfk.get(message.guild.id, message.author.id);

  if (currentStatus != null)
  {
    message.client.db.users.updateAfk.run(null, message.author.id, message.guild.id)
    if(message.member.nickname) message.member.setNickname(`${message.member.nickname.replace('[AFK]','')}`).catch(err=>{console.log()})
    message.channel.send(`${online} Welcome back ${message.author}, you are not afk anymore!`).delete({timeout: 5000})
  }

  if (message.mentions.users.size > 0)
  {
    message.mentions.users.forEach(user=>{
      const {
        afk: currentStatus,
        afk_time: afkTime
      } = message.client.db.users.selectAfk.get(message.guild.id, user.id);
      if (currentStatus != null)
      {
        const d = new Date(afkTime)
        message.channel.send(`${dnd} ${user.username} is afk! ${currentStatus} - ${moment(d).fromNow()}`).delete({timeout: 5000})
      }
    })
  }

  // Get disabled commands
  let disabledCommands = client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
  if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');

  // Get points
  const { point_tracking: pointTracking, message_points: messagePoints, command_points: commandPoints } =
      client.db.settings.selectPoints.get(message.guild.id);

  // Command handler
  const prefix = client.db.settings.selectPrefix.pluck().get(message.guild.id);
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`);

  if (prefixRegex.test(message.content)) {

    // Get mod channels
    let modChannelIds = message.client.db.settings.selectModChannelIds.pluck().get(message.guild.id) || [];
    if (typeof(modChannelIds) === 'string') modChannelIds = modChannelIds.split(' ');

    const [, match] = message.content.match(prefixRegex);
    const args = message.content.slice(match.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    let command = client.commands.get(cmd) || client.aliases.get(cmd); // If command not found, check aliases
    if (command && !disabledCommands.includes(command.name)) {

      // Check if mod channel
      if (modChannelIds.includes(message.channel.id)) {
        if (
            command.type != client.types.MOD || (command.type == client.types.MOD &&
            message.channel.permissionsFor(message.author).missing(command.userPermissions) != 0)
        ) {
          // Update points with messagePoints value
          if (pointTracking)
            client.db.users.updatePoints.run({ points: messagePoints }, message.author.id, message.guild.id);
          return; // Return early so Splite doesn't respond
        }
      }

      // Check permissions
      const permission = command.checkPermissions(message);
      if (permission) {

        // Update points with commandPoints value
        if (pointTracking)
          client.db.users.updatePoints.run({ points: commandPoints }, message.author.id, message.guild.id);
        message.command = true; // Add flag for messageUpdate event
        return command.run(message, args); // Run command
      }
    } else if (
        (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) &&
        message.channel.permissionsFor(message.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS']) &&
        !modChannelIds.includes(message.channel.id)
    ) {
      const embed = new MessageEmbed()
          .setTitle('Hi, I\'m Splite. Need help?')
          .setThumbnail('https://i.imgur.com/B0XSinY.png')
          .setDescription(`You can see everything I can do by using the \`${prefix}help\` command.`)
          .addField('Invite Me', oneLine`
          You can add me to your server by clicking 
          [here](https://discord.com/api/oauth2/authorize?client_id=832753795854237697&permissions=8&scope=bot%20applications.commands)!
        `)
          .addField('Support', oneLine`
          If you have questions, suggestions, or found a bug, please use the 'report' or 'feedback' commands`)
          .setFooter('DM split#0420 to speak directly with the developer!')
          .setColor(message.guild.me.displayHexColor);
      message.channel.send(embed);
    }
  }

  // Update points with messagePoints value
  if (pointTracking) client.db.users.updatePoints.run({ points: messagePoints }, message.author.id, message.guild.id);
};