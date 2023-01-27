const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearVerificationMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearverificationmessage',
            aliases: ['clearverificationmsg', 'clearvm', 'cvm'],
            usage: 'clearverificationmessage',
            description: oneLine`
        Clears the \`verification message\` used in \`verification channel\`.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            userPermissions: ['ManageGuild'],
            examples: ['clearverificationmessage'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: oldVerificationMessage,
            verification_message_id: verificationMessageId,
        } = this.client.db.settings.selectVerification.get(context.guild.id);
        context.guild.roles.cache.get(verificationRoleId);
        context.guild.channels.cache.get(
            verificationChannelId
        );

        // Get status
        const oldStatus = this.client.utils.getStatus(
            verificationRoleId && verificationChannelId && oldVerificationMessage
        );

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Verification`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`verification message\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.client.db.settings.updateVerificationMessage.run(
            null,
            context.guild.id
        );
        this.client.db.settings.updateVerificationMessageId.run(
            null,
            context.guild.id
        );

        // Clear if no args provided
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .addFields({
                    name: 'Verification Message ID',
                    value: `${verificationMessageId} ➔ \`None\``
                })
                .addFields({
                    name: 'Verification Message',
                    value: `${oldVerificationMessage} ➔ \`None\``
                })
                .addFields([{name: 'Status', value: `\`${statusUpdate}\``}]),],
        };

        this.sendReply(context, payload);
    }
};
