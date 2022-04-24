const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class PrefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            aliases: ['pre'],
            usage: 'prefix',
            description: `Fetches ${client.name}\'s current prefix.`,
            type: client.types.INFO
        });
    }

    run(message, args) {
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id); // Get prefix
        const embed = new MessageEmbed()
            .setTitle(`${message.client.name}\'s Prefix`)
            .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
            .addField('Prefix', `\`${prefix}\``, true)
            .addField('Example', `\`${prefix}ping\``, true)
            .setFooter({text: `To change the prefix, type ${prefix}setprefix`})
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
