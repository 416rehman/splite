const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, verify} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');
const emojis = require('../../utils/emojis.json');

module.exports = class SetVerificationRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setverificationrole',
            aliases: ['setvr', 'svr'],
            usage: 'setverificationrole <role mention/ID>',
            description: oneLine`
        Sets the role ${client.name} will give members who are verified.        
        A \`verification role\`, a \`verification channel\`, 
        and a \`verification message\` must be set to enable server verification.
        \nUse \`clearverificationrole\` role to clear the current \`verification role\`.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setverificationrole @Verified', 'clearverificationrole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        await this.handle(role, interaction, true);
    }

    async handle(role, context, isInteraction) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
            verification_message_id: verificationMessageId,
        } = this.client.db.settings.selectVerification.get(context.guild.id);
        const oldVerificationRole = context.guild.roles.cache.get(verificationRoleId) || '`None`';
        const verificationChannel = context.guild.channels.cache.get(verificationChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(verificationRoleId && verificationChannelId && verificationMessage);

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024) verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Verification`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addFields([{name: 'Channel', value:  verificationChannel?.toString() || '`None`', inline:  true}])
            .addFields([{name: 'Message', value:  verificationMessage || '`None`'}])
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear role
        if (!role) {
            const payload = ({
                embeds: [embed
                    .spliceFields(0, 0, {
                        name: 'Current Verification Role', value: `${oldVerificationRole}`, inline: true,
                    })
                    .spliceFields(2, 0, {
                        name: 'Status', value: `\`${oldStatus}\``, inline: true,
                    })
                    .setDescription(this.description),],
            });

            if (isInteraction) await context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        // Update role
        embed.setDescription(`The \`verification role\` was successfully updated. ${success}\nUse \`clearverificationrole\` role to clear the current \`verification role\`.`);
        role = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!role) {
            const payload = emojis.fail + ' Please mention a role or provide a valid role ID.';
            if (isInteraction) await context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        this.client.db.settings.updateVerificationRoleId.run(role.id, context.guild.id);

        // Update status
        const status = this.client.utils.getStatus(role && verificationChannel && verificationMessage);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = ({
            embeds: [embed
                .spliceFields(0, 0, {
                    name: 'Role', value: `${oldVerificationRole} ➔ ${role}`, inline: true,
                })
                .spliceFields(2, 0, {
                    name: 'Status', value: statusUpdate, inline: true,
                }),],
        });

        if (isInteraction) await context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);

        // Update verification
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
                    embeds: [new EmbedBuilder()
                        .setDescription(verificationMessage.slice(3, -3))
                        .setColor(context.guild.members.me.displayHexColor),],
                });
                await msg.react(verify.split(':')[2].slice(0, -1));
                this.client.db.settings.updateVerificationMessageId.run(msg.id, context.guild.id);
            }
            else {
                return this.client.sendSystemErrorMessage(context.guild, 'verification', stripIndent`
          Unable to send verification message, please ensure I have permission to access the verification channel
        `);
            }
        }
    }
};
