const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
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

    run(message, args) {
        const d = moment.duration(message.client.uptime);
        const days = (d.days() == 1) ? `${d.days()} day` : `${d.days()} days`;
        const hours = (d.hours() == 1) ? `${d.hours()} hour` : `${d.hours()} hours`;
        const minutes = (d.minutes() == 1) ? `${d.minutes()} minute` : `${d.minutes()} minutes`;
        const seconds = (d.seconds() == 1) ? `${d.seconds()} second` : `${d.seconds()} seconds`;
        const date = moment().subtract(d, 'ms').format('dddd, MMMM Do YYYY');
        const embed = new MessageEmbed()
            .setTitle(`${message.client.name}\'s Uptime`)
            .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
            .setDescription(`\`\`\`prolog\n${days}, ${hours}, ${minutes}, and ${seconds}\`\`\``)
            .addField('Date Launched', date)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
