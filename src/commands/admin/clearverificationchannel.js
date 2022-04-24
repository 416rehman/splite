const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, verify} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class clearVerificationChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearverificationchannel',
            aliases: ['clearvc', 'cvc'],
            usage: 'clearverificationchannel',
            description: oneLine`
        Clears the verification text channel for your server.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearverificationchannel']
        });
    }

    async run(message, args) {

        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
            verification_message_id: verificationMessageId
        } = message.client.db.settings.selectVerification.get(message.guild.id);
        const verificationRole = message.guild.roles.cache.get(verificationRoleId);
        const oldVerificationChannel = message.guild.channels.cache.get(verificationChannelId) || '`None`';

        // Get status
        const oldStatus = message.client.utils.getStatus(
            verificationRoleId && verificationChannelId && verificationMessage
        );

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024)
            verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Verification`')
            .setDescription(`The \`verification channel\` was successfully cleared. ${success}`)
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        message.client.db.settings.updateVerificationChannelId.run(null, message.guild.id);
        const status = 'disabled';
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        message.channel.send({
            embeds: [embed.addField('Verification Channel', `${oldVerificationChannel}  ➔ \`None\``)
                .addField('Status', `${oldStatus} ➔ \`${statusUpdate}\``)]
        })
    }
};
