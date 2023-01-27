const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, verify, fail} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetVerificationChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setverificationchannel',
            aliases: ['setvc', 'svc'],
            usage: 'setverificationchannel <channel mention/ID>',
            description: oneLine`
        Sets the verification text channel for your server. If set, unverified members will start here.
        Once verified, the \`verification role\` will be assigned to them.
        Please ensure that new members are not able access other server channels for proper verification.
        A \`verification channel\`, a \`verification message\`, 
        and an \`verification role\` must be set to enable server verification.
        \nUse \`clearverificationchannel\` to clear current \`verification channel\`.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            userPermissions: ['ManageGuild'],
            examples: [
                'setverificationchannel #verification',
                'clearverificationchannel',
            ],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel');
        await this.handle(channel, interaction, true);
    }

    async handle(channel, context, isInteraction) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
            verification_message_id: verificationMessageId,
        } = this.client.db.settings.selectVerification.get(context.guild.id);
        const verificationRole =
            context.guild.roles.cache.get(verificationRoleId);
        const oldVerificationChannel =
            context.guild.channels.cache.get(verificationChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(
            verificationRoleId && verificationChannelId && verificationMessage
        );

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024)
            verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Verification`')
            .addFields([{name: 'Role', value: verificationRole.toString() || '`None`', inline: true}])
            .addFields([{name: 'Message', value: verificationMessage || '`None`'}])
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Display current verification channel
        if (!channel) {
            // Update status
            return context.channel.send({
                embeds: [
                    embed
                        .spliceFields(1, 0, {
                            name: 'Current Verification Channel',
                            value: `${oldVerificationChannel}`,
                            inline: true,
                        })
                        .spliceFields(2, 0, {
                            name: 'Status',
                            value: `\`${oldStatus}\``,
                            inline: true,
                        })
                        .setDescription(this.description),
                ],
            });
        }
        embed.setDescription(
            `The \`verification channel\` was successfully updated. ${success}\nUse \`clearverificationchannel\` to clear current \`verification channel\`.`
        );
        const verificationChannel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!verificationChannel || verificationChannel.type != ChannelType.GuildText || !verificationChannel.viewable) {
            const payload = `${fail} Please provide a valid \`verification channel\`.`;

            this.sendReply(context, payload);
            return;
        }

        // Update status
        const status = this.client.utils.getStatus(verificationRole && verificationChannel && verificationMessage);
        const statusUpdate = oldStatus != status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        this.client.db.settings.updateVerificationChannelId.run(verificationChannel.id, context.guild.id);
        const payload = ({
            embeds: [
                embed
                    .spliceFields(1, 0, {
                        name: 'Channel',
                        value: `${oldVerificationChannel} ➔ ${verificationChannel}`,
                        inline: true,
                    })
                    .spliceFields(2, 0, {
                        name: 'Status',
                        value: statusUpdate,
                        inline: true,
                    }),
            ],
        });

        await this.sendReply(context, payload);

        // Send verification message to the new verification channel
        if (status === 'enabled') {
            if (verificationChannel.viewable) {
                try {
                    await verificationChannel.messages.fetch(verificationMessageId);
                }
                catch (err) {
                    // Message was deleted
                    this.client.logger.error(err);
                }
                const msg = await verificationChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(verificationMessage.slice(3, -3))
                    ],
                });
                await msg.react(verify.split(':')[2].slice(0, -1));
                this.client.db.settings.updateVerificationMessageId.run(msg.id, context.guild.id);
            }
            else {
                return this.client.sendSystemErrorMessage(
                    context.guild,
                    'verification',
                    stripIndent`
          Unable to send verification message, please ensure I have permission to access the verification channel
        `
                );
            }
        }
    }
};
