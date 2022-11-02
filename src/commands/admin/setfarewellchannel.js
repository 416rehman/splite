const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetFarewellChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setfarewellchannel',
            aliases: ['setfc', 'sfc', 'setleavechannel'],
            usage: 'setfarewellchannel <channel mention/ID>',
            description: oneLine`
        Sets the farewell message text channel for your server. 
        \nUse \`clearfarewellchannel\` to clear the current \`farewell channel\`.
        A \`farewell message\` must also be set to enable farewell messages.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setfarewellchannel #general', 'clearfarewellchannel'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getChannel('channel');
        this.handle(role, interaction, true);
    }

    handle(channel, context, isInteraction) {
        let {
            farewell_channel_id: farewellChannelId,
            farewell_message: farewellMessage,
        } = this.client.db.settings.selectFarewells.get(context.guild.id);
        const oldFarewellChannel =
            context.guild.channels.cache.get(farewellChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(
            farewellChannelId,
            farewellMessage
        );

        // Trim message
        if (farewellMessage && farewellMessage.length > 1024)
            farewellMessage = farewellMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Farewells`')

            .addField(
                'Message',
                this.client.utils.replaceKeywords(farewellMessage) || '`None`'
            )
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .spliceFields(0, 0, {
                            name: 'Current Farewell Channel',
                            value: `${oldFarewellChannel}` || '`None`',
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

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildNews) || !channel.viewable) {
            const payload = `${fail} The channel must be a text channel. Please try again.`;

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        // Update status
        const status = this.client.utils.getStatus(
            channel,
            farewellMessage
        );
        const statusUpdate = oldStatus != status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        this.client.db.settings.updateFarewellChannelId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed
                    .spliceFields(0, 0, {
                        name: 'Channel',
                        value: `${oldFarewellChannel} ➔ ${channel}`,
                        inline: true,
                    })
                    .spliceFields(1, 0, {
                        name: 'Status',
                        value: statusUpdate,
                        inline: true,
                    }).setDescription(
                        `The \`farewell channel\` was successfully updated. ${success}\nUse \`clearfarewellchannel\` to clear the current \`farewell channel\`.`
                    ),
            ],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
