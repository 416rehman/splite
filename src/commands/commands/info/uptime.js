const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = class UptimeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'uptime',
      aliases: ['up'],
      usage: 'uptime',
      description: `Fetches ${client.name}\'s current uptime.`,
      type: client.types.INFO
    });
  }
  async run(message, args) {
    const days = Math.floor(message.client.uptime / 86400000);
    const hours = Math.floor(message.client.uptime / 3600000) % 24;
    const minutes = Math.floor(message.client.uptime / 60000) % 60;
    const seconds = Math.floor(message.client.uptime / 1000) % 60;
    const d = moment.duration(message.client.uptime);
    const date = moment().subtract(d, 'ms').format('dddd, MMMM Do YYYY');
    const RemoveUseless = (Duration) => { return Duration.replace("0 day\n", "").replace("0 hour\n", "").replace("0 minute\n", "") };
    const Uptime = await RemoveUseless(`${days} ${days > 1 ? "days" : "day"} ${hours} ${hours > 1 ? "hours" : "hour"} ${minutes} ${minutes > 1 ? "minutes" : "minute"} ${seconds} ${seconds > 1 ? "seconds" : "second"}`);

    const embed = new MessageEmbed()
      .setTitle(`${message.client.name}'s Uptime`)
      .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
      .setDescription(`\`\`\`prolog\n${Uptime}\`\`\``)
      .addField('Date Launched', date)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send({embeds: [embed]});
  }
};
