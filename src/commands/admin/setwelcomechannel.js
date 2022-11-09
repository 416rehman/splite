const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetWelcomeChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setwelcomechannel',
            aliases: ['setwc', 'swc', 'setgreetchannel'],
            usage: 'setwelcomechannel <channel mention/ID>',
            description: oneLine`
        Sets the welcome message text channel for your server.      
        A \`welcome message\` must also be set to enable welcome messages.
        \nUse \`clearwelcomechannel\` to clear the current \`welcome channel\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setwelcomechannel #general', 'clearwelcomechannel'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel');
        this.handle(channel, interaction, true);
    }

    handle(channel, context, isInteraction) {
        let {
            welcome_channel_id: welcomeChannelId,
            welcome_message: welcomeMessage,
        } = this.client.db.settings.selectWelcomes.get(context.guild.id);
        const oldWelcomeChannel =
            context.guild.channels.cache.get(welcomeChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(
            welcomeChannelId,
            welcomeMessage
        );

        // Trim message
        if (welcomeMessage && welcomeMessage.length > 1024)
            welcomeMessage = welcomeMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Welcomes`')
            .addField(
                'Message',
                this.client.utils.replaceKeywords(welcomeMessage) || '`None`'
            )
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!channel) {
            return context.channel.send({
                embeds: [
                    embed
                        .spliceFields(0, 0, {
                            name: 'Current Welcome Channel',
                            value: `${oldWelcomeChannel}`,
                            inline: true,
                        })
                        .spliceFields(1, 0, {
                            name: 'Status',
                            value: `\`${oldStatus}\``,
                            inline: true,
                        })
                        .setDescription(this.description),
                ],
            });
        }

        embed.setDescription(
            `The \`welcome channel\` was successfully updated. ${success}\nUse \`clearwelcomechannel\` to clear the current \`welcome channel\`.`
        );
        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);
        if (!channel || (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildNews) || !channel.viewable) {
            const payload = `${fail} Please provide a valid text channel.`;

            this.sendReply(context, payload);
            return;
        }

        // Update status
        const status = this.client.utils.getStatus(channel, welcomeMessage);
        const statusUpdate = oldStatus != status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        this.client.db.settings.updateWelcomeChannelId.run(channel.id, context.guild.id);
        const payload = ({
            embeds: [
                embed
                    .spliceFields(0, 0, {
                        name: 'Channel',
                        value: `${oldWelcomeChannel} ➔ ${channel}`,
                        inline: true,
                    })
                    .spliceFields(1, 0, {
                        name: 'Status',
                        value: statusUpdate,
                        inline: true,
                    }),
            ],
        });

        this.sendReply(context, payload);
    }
};
