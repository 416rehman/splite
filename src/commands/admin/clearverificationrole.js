const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearVerificationRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearverificationrole',
            aliases: ['clearvr', 'cvr'],
            usage: 'clearverificationrole',
            description: oneLine`
        Clears the role ${client.name} will give members who are verified.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearverificationrole'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
        } = this.client.db.settings.selectVerification.get(context.guild.id);
        const oldVerificationRole = context.guild.roles.cache.get(verificationRoleId) || '`None`';
        const verificationChannel = context.guild.channels.cache.get(verificationChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(verificationRoleId && verificationChannelId && verificationMessage);

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024) verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Verification`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(`The \`verification role\` was successfully cleared. ${success}`)
            .addField('Channel', verificationChannel?.toString() || '`None`', true)
            .addField('Message', verificationMessage || '`None`')
            .setFooter({
                text: context.member.displayName, iconURL: context.author.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Clear role
        this.client.db.settings.updateVerificationRoleId.run(null, context.guild.id);

        // Clear if no args provided
        const status = 'disabled';
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .addField('Verification Role', `${oldVerificationRole} ➔ \`None\``)
                .addField('Status', `${oldStatus} ➔ \`${statusUpdate}\``)],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
