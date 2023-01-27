const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearFarewellChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearfarewellchannel',
            aliases: ['clearfc', 'cfc', 'clearleavechannel'],
            usage: 'clearfarewellchannel',
            description: oneLine`
        Clears the farewell message text channel for your server. 
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearfarewellchannel'],
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
            .setDescription(
                `The \`farewell channel\` was successfully cleared. ${success}`
            )
            .addFields({
                name: 'Message',
                value: this.client.utils.replaceKeywords(farewellMessage) || '`None`'
            })
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateFarewellChannelId.run(
            null,
            context.guild.id
        );

        // Update status
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;


        const payload = {
            embeds: [
                embed
                    .spliceFields(0, 0, {
                        name: 'Channel',
                        value: `${oldFarewellChannel} ➔ \`None\``,
                        inline: true,
                    })
                    .spliceFields(1, 0, {
                        name: 'Status',
                        value: statusUpdate,
                        inline: true,
                    }),
            ],
        };

        this.sendReply(context, payload);
    }
};
