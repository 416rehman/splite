const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class clearFarewellChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearfarewellchannel',
            aliases: ['clearfc', 'cfc', 'clearleavechannel'],
            usage: 'clearfarewellchannel',
            description: oneLine`
        Clears the farewell message text channel for your server. 
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearfarewellchannel']
        });
    }

    run(message, args) {
        let {farewell_channel_id: farewellChannelId, farewell_message: farewellMessage} =
            message.client.db.settings.selectFarewells.get(message.guild.id);
        const oldFarewellChannel = message.guild.channels.cache.get(farewellChannelId) || '`None`';

        // Get status
        const oldStatus = message.client.utils.getStatus(farewellChannelId, farewellMessage);

        // Trim message
        if (farewellMessage && farewellMessage.length > 1024) farewellMessage = farewellMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Farewells`')
            .setDescription(`The \`farewell channel\` was successfully cleared. ${success}`)
            .addField('Message', message.client.utils.replaceKeywords(farewellMessage) || '`None`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        message.client.db.settings.updateFarewellChannelId.run(null, message.guild.id);

        // Update status
        const status = 'disabled';
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        return message.channel.send({
            embeds: [embed
                .spliceFields(0, 0, {name: 'Channel', value: `${oldFarewellChannel} ➔ \`None\``, inline: true})
                .spliceFields(1, 0, {name: 'Status', value: statusUpdate, inline: true})
            ]
        });
    }
};
