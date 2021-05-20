const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success, verify, fail } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class setJoinVoting extends Command {
  constructor(client) {
    super(client, {
      name: 'setjoinvoting',
      aliases: ['joingate', 'joinvoting', 'sjv'],
      usage: `setjoinvoting <messageID> <emoji> <votingChannel>`,
      description: oneLine`
        Reacts to the provided message with the specified emoji\nIf someone reacts to the emoji, a vote will start in the votingChannel.\nThe person that reacted will either be banned or \nleft alone depending on how many votes they received.\n\n**Useful if you are setting an 18+ server, anyone that\n reacts to the -18 emoji will initiate a vote.\nUse \`clearJoinVoting\` to disable`,
      type: client.types.ADMIN,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setjoinvoting 832878346979377193 🦶 #generalChannel','clearjoinvoting']
    });
  }
  async run(message, args) {
    let {
      joinvoting_message_id: joinvotingMessageId,
      joinvoting_emoji: joinvotingEmoji,
      voting_channel_id: votingChannelID
    } = message.client.db.settings.selectJoinVotingMessage.get(message.guild.id);

      // Get status
      const oldStatus = message.client.utils.getStatus(
          joinvotingMessageId && joinvotingEmoji && votingChannelID
      );

    if (!args[0]) {
      const embed = new MessageEmbed()
          .setTitle('Settings: `Join Voting`')
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          .setDescription(this.description)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);

      const emoji = await message.guild.emojis.cache.find(e => e.id === joinvotingEmoji) || joinvotingEmoji
      return message.channel.send(embed
        .addField('Status', oldStatus, true)
        .addField('Current MessageID', `\`${joinvotingMessageId || 'None'}\``)
        .addField('Current Emoji', `${emoji || '`None`'}`)
        .addField('Current ChannelID', `${'<#'+ votingChannelID +'>' || '`None`'}`)
      );
    }
    else if (args.length > 2)
    {
      let emoji, emojiValue = null, joinVotingMessage;

      //messageID
      if ((/^[0-9]{18}$/g).test(args[0])) {
        try {
          joinVotingMessage = await message.channel.messages.fetch(args[0])
        }catch (err) {
          return this.sendErrorMessage(message, 1, 'Failed to find the message', err.message);
        }
      }
      else {
        return this.sendErrorMessage(message, 0, `First argument needs to be a messageID. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`);
      }

      //EmojiID
      if ((/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu).test(args[1]))
      {
        emoji = args[1]
        emojiValue = args[1]
      }
      else if (/<a?:.+:\d+>/gm.test(args[1]))
      {
        try {
          let id = args[1].split(':')
          id = id.reverse()[0]
          id = id.replace('>','')
          emoji = await message.guild.emojis.cache.find(e => e.id === id)
          emojiValue = id;
        }catch (err) {
          return this.sendErrorMessage(message, 1, 'Failed to find the Emoji', err.message);
        }
      }
      else {
        return this.sendErrorMessage(message, 0, `Second argument needs to be an emoji. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`);
      }

      //VotingChannelID
      if ((/<#(\d{18})>/gm).test(args[2])) {
        try {
          message.guild.channels.cache.get(args[2])
        } catch (err) {
          return this.sendErrorMessage(message, 0, `Failed to find the channel. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`, err.message);
        }
      }
      else {return this.sendErrorMessage(message, 0, `Please specifiy a channel. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`);}
      try {
        await joinVotingMessage.react(emoji)
      }catch (err) {
        return this.sendErrorMessage(message, 0, `Failed to setup join voting. Emojis must be from this server. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`, err.message);
      }
      let votingChannelID = args[2].replace('<#','')
      votingChannelID = votingChannelID.replace('>','')
      message.client.db.settings.updateJoinVotingMessageId.run(args[0], message.guild.id);
      message.client.db.settings.updateJoinVotingEmoji.run(emojiValue, message.guild.id);
      message.client.db.settings.updateVotingChannelID.run(votingChannelID, message.guild.id);

      const embed = new MessageEmbed()
          .setTitle('Settings: `Join Voting`')
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          .setDescription(`The \`join voting system\` was successfully updated. ${success}\nUse \`clearJoinVoting\` to disable`)
          .addField('Status', "\`enabled\`", true)
          .addField('message ID', `\`${args[0]}\``)
          .addField('Voting Channel', `${args[2]}`)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);

      await message.channel.send(embed);
    }
  }
};