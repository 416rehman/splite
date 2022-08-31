const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
            userPermissions: ['MANAGE_GUILD'],
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

    handle(context, isInteraction) {
        const systemChannelId = this.client.db.settings.selectSystemChannelId
            .pluck()
            .get(context.guild.id);
        const oldSystemChannel =
            context.guild.channels.cache.get(systemChannelId) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`system channel\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Clear if no args provided
        this.client.db.settings.updateSystemChannelId.run(
            null,
            context.guild.id
        );

        const payload = {embeds: [embed.addField('System Channel', `${oldSystemChannel} ➔ \`None\``),],};

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
