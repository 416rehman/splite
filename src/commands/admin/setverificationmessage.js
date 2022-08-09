const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
        this.handle(text, interaction, true);
    }

    async handle(text, context, isInteraction) {
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

        const embed = new MessageEmbed()
            .setTitle('Settings: `Verification`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .addField('Role', verificationRole?.toString() || '`None`', true)
            .addField('Channel', verificationChannel?.toString() || '`None`', true)
            .setFooter({
                text: context.member.displayName, iconURL: context.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (!text) {
            const payload = ({
                embeds: [embed
                    .addField('Status', `\`${oldStatus}\``, true)
                    .addField('Current Message ID', `\`${verificationMessageId}\``)
                    .addField('Current Message', `\`${oldVerificationMessage}\``)
                    .setDescription(this.description),],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
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
                .addField('Status', statusUpdate, true)
                .addField('Message', text),],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);

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
                    embeds: [new MessageEmbed()
                        .setDescription(text)
                        .setColor(context.guild.me.displayHexColor),],
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
