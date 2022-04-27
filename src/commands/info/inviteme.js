const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');

module.exports = class InviteMeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'inviteme',
            aliases: ['invite', 'invme', 'im'],
            usage: 'inviteme',
            description: `Generates a link you can use to invite ${client.name} to your own server.`,
            type: client.types.INFO,
        });
    }

    run(message) {
        const embed = new MessageEmbed()
            .setTitle('Invite Me')
            .setThumbnail(
                `${
                    message.client.config.botLogoURL ||
                    'https://i.imgur.com/B0XSinY.png'
                }`
            )
            .setDescription(
                oneLine`
        Click [here](${message.client.link})
        to invite me to your server!
      `
            )
            .addField('Developed By', `**${message.client.ownerTag}**`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        if (message.client.config.botLogoURL)
            message.channel.send({embeds: [embed]});
    }
};
