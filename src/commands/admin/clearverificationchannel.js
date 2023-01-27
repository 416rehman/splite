const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

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
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            userPermissions: ['ManageGuild'],
            examples: ['clearverificationchannel'],
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
            verification_message: verificationMessage,
        } = this.client.db.settings.selectVerification.get(context.guild.id);

        context.guild.roles.cache.get(verificationRoleId);

        const oldVerificationChannel =
            context.guild.channels.cache.get(verificationChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(
            verificationRoleId && verificationChannelId && verificationMessage
        );

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Verification`')
            .setDescription(
                `The \`verification channel\` was successfully cleared. ${success}`
            )
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateVerificationChannelId.run(
            null,
            context.guild.id
        );
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .addFields({
                    name: 'Verification Channel',
                    value: `${oldVerificationChannel}  ➔ \`None\``
                })
                .addFields([{name: 'Status', value: `${oldStatus} ➔ \`${statusUpdate}\``}]),],
        };

        this.sendReply(context, payload);
    }
};
