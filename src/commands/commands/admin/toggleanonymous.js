const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, fail} = require('../../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class ToggleAnonymous extends Command {
    constructor(client) {
        super(client, {
            name: 'toggleanonymous',
            aliases: ['tanon', 'toganon', 'toggleanon', 'anon', 'disableanonymous', 'enableanonymous'],
            usage: 'toggleanonymous <role mention/ID>',
            description: oneLine`
        Enables or disables the /anonymous slash command for the server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['toggleanonymous @Member']
        });
    }

    run(message, args) {
        const anonymousState = message.client.db.settings.selectAnonymous.pluck().get(message.guild.id);
        let description;

        // Disabled anonymous
        if (!anonymousState) {
            message.client.db.settings.updateAnonymous.run(1, message.guild.id)
            description = `Anonymous messages have been enabled! Type /anonymous to send an anonymous message. ${success}`;
        } else {
            message.client.db.settings.updateAnonymous.run(0, message.guild.id)
            description = `Anonymous messages have been disabled! ${fail}`;
        }

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(description)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
