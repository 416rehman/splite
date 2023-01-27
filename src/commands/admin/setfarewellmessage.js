const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetFarewellMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setfarewellmessage',
            aliases: ['setfarewellmsg', 'setfm', 'sfm', 'setleavemessage', 'setleavemsg',],
            usage: 'setfarewellmessage <message>',
            description: oneLine`
        Sets the message ${client.name} will say when someone leaves your server.
        You may use \`?member\` to substitute for a user mention,
        \`?username\` to substitute for someone's username,
        \`?tag\` to substitute for someone's full Discord tag (username + discriminator),
        and \`?size\` to substitute for your server's current member count.
        \nUse \`clearfarewellmessage\` to clear the current \`farewell message\`.
        A \`farewell channel\` must also be set to enable farewell messages.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setfarewellmessage ?member has left the server.', 'clearfarewellmessage',],
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

    handle(text, context) {
        const {
            farewell_channel_id: farewellChannelId, farewell_message: oldFarewellMessage,
        } = this.client.db.settings.selectFarewells.get(context.guild.id);
        const farewellChannel = context.guild.channels.cache.get(farewellChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(farewellChannelId, oldFarewellMessage);

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Farewells`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .addFields([{name: 'Channel', value: farewellChannel?.toString() || '`None`', inline: true}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (!text) {
            const payload = ({
                embeds: [embed
                    .addFields([{name: 'Current Farewell Message', value: `${oldFarewellMessage}` || '`None`'}])
                    .addFields([{name: 'Status', value: oldStatus, inline: true}])
                    .setDescription(this.description),],
            });

            this.sendReply(context, payload);
            return;
        }


        this.client.db.settings.updateFarewellMessage.run(text, context.guild.id);
        if (text.length > 1024) text = text.slice(0, 1021) + '...';

        // Update status
        const status = this.client.utils.getStatus(farewellChannel, text);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = ({
            embeds: [embed
                .addFields([{name: 'Status', value: statusUpdate, inline: true}])
                .addFields([{name: 'Message', value: this.client.utils.replaceKeywords(text)}])
                .setDescription(`The \`farewell message\` was successfully updated. ${success}\nUse \`clearfarewellmessage\` to clear the current \`farewell message\`.`),],
        });

        this.sendReply(context, payload);
    }
};
