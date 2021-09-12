const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');

module.exports = class FeedbackCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'feedback',
      aliases: ['fb'],
      usage: 'feedback <message>',
      description: `Sends a message to the ${client.name} developers feedback page.`,
      type: client.types.MISC,
      examples: [`feedback We love ${client.name}!`]
    });
  }
  run(message, args) {
    const feedbackChannel = message.client.channels.cache.get(message.client.feedbackChannelId);
    if (!feedbackChannel) 
      return this.sendErrorMessage(message, 1, 'The feedbackChannelId property has not been set');
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a message to send');
    let feedback = message.content.slice(message.content.indexOf(args[0]), message.content.length);

    // Send report
    const feedbackEmbed = new MessageEmbed()
      .setTitle('Feedback')
      .setThumbnail(feedbackChannel.guild.iconURL({ dynamic: true }))
      .setDescription(feedback)
      .addField('User', message.member, true)
      .addField('Server', message.guild.name, true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    feedbackChannel.send({embeds: [feedbackEmbed]});

    // Send response
    if (feedback.length > 1024) feedback = feedback.slice(0, 1021) + '...';
    const embed = new MessageEmbed()
      .setTitle('Feedback')
      .setThumbnail('https://i.imgur.com/B0XSinY.png')
      .setDescription(oneLine`
        Successfully sent feedback!
        Please contact the developer (${message.client.ownerTag}) to further discuss your feedback.
      `) 
      .addField('Member', message.member, true)
      .addField('Message', feedback)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send({embeds: [embed]});
  }
};