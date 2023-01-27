const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearSystemChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearsystemchannel',
            aliases: ['clearsc', 'csc'],
            usage: 'clearsystemchannel',
            description: oneLine`
        Clears the system text channel for your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearsystemchannel'],
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
        const systemChannelId = this.client.db.settings.selectSystemChannelId
            .pluck()
            .get(context.guild.id);
        const oldSystemChannel =
            context.guild.channels.cache.get(systemChannelId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`system channel\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateSystemChannelId.run(
            null,
            context.guild.id
        );

        const payload = {
            embeds: [embed.addFields([{
                name: 'System Channel',
                value: `${oldSystemChannel} ➔ \`None\``
            }]),],
        };

        this.sendReply(context, payload);
    }
};
