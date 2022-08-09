const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearFarewellMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearfarewellmessage',
            aliases: ['clearfarewellmsg', 'clearfm', 'cfm', 'clearleavemessage', 'clearleavemsg',],
            usage: 'clearfarewellmessage',
            description: oneLine`
        clears the message ${client.name} will say when someone leaves your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearfarewellmessage'],
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
        const {
            farewell_channel_id: farewellChannelId, farewell_message: oldFarewellMessage,
        } = this.client.db.settings.selectFarewells.get(context.guild.id);
        const farewellChannel = context.guild.channels.cache.get(farewellChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(farewellChannelId, oldFarewellMessage);

        const embed = new MessageEmbed()
            .setTitle('Settings: `Farewells`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(`The \`farewell message\` was successfully cleared. ${success}`)
            .addField('Channel', farewellChannel?.toString() || '`None`', true)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Update status
        this.client.db.settings.updateFarewellMessage.run(null, context.guild.id);
        const status = 'disabled';
        const statusUpdate = oldStatus != status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .addField('Status', statusUpdate, true)
                .addField('Message', '`None`'),],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
