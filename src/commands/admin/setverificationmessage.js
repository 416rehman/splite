const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, verify} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetVerificationMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setverificationmessage',
            aliases: ['setverificationmsg', 'setvm', 'svm'],
            usage: 'setverificationmessage <message>',
            description: oneLine`
        Sets the message ${client.name} will post in the \`verification channel\`.
        A \`verification role\`, a \`verification channel\`, 
        and a \`verification message\` must be set to enable server verification.
        \nUse \`clearverificationmessage\` to clear the verification message.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setverificationmessage Please read the server rules, then react to this message.', 'clearverificationmessage',],
        });
    }

    run(message, args) {
        let text = args[0] ? message.content.slice(message.content.indexOf(args[0]), message.content.length) : '';
        this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text');
        await this.handle(text, interaction, true);
    }

    async handle(text, context) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: oldVerificationMessage,
            verification_message_id: verificationMessageId,
        } = this.client.db.settings.selectVerification.get(context.guild.id);
        const verificationRole = context.guild.roles.cache.get(verificationRoleId);
        const verificationChannel = context.guild.channels.cache.get(verificationChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(verificationRoleId && verificationChannelId && oldVerificationMessage);

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Verification`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .addFields([{name: 'Role', value:  verificationRole?.toString() || '`None`', inline:  true}])
            .addFields([{name: 'Channel', value:  verificationChannel?.toString() || '`None`', inline:  true}])
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (!text) {
            const payload = ({
                embeds: [embed
                    .addFields([{name: 'Status', value:  `\`${oldStatus}\``, inline:  true}])
                    .addFields([{name: 'Current Message ID', value:  `\`${verificationMessageId}\``}])
                    .addFields([{name: 'Current Message', value:  `\`${oldVerificationMessage}\``}])
                    .setDescription(this.description),],
            });

            this.sendReply(context, payload);
            return;
        }

        embed.setDescription(`The \`verification message\` was successfully updated. ${success}\nUse \`clearverificationmessage\` to clear the verification context.`);

        this.client.db.settings.updateVerificationMessage.run(text, context.guild.id);
        if (text.length > 1024) text = text.slice(0, 1021) + '...';

        // Update status
        const status = this.client.utils.getStatus(verificationRole && verificationChannel && text);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = ({
            embeds: [embed
                .addFields([{name: 'Status', value:  statusUpdate, inline:  true}])
                .addFields([{name: 'Message', value:  text}]),],
        });

        await this.sendReply(context, payload);

        // Update verification and send the new message to the verification channel
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
                        .setDescription(text)
                        .setColor(context.guild.members.me.displayHexColor),],
                });
                await msg.react(verify.split(':')[2].slice(0, -1));
                this.client.db.settings.updateVerificationMessageId.run(msg.id, context.guild.id);
            }
            else {
                return this.client.sendSystemErrorMessage(context.guild, 'verification', stripIndent`Unable to send verification message, please ensure I have permission to access the verification channel`);
            }
        }
    }
};
