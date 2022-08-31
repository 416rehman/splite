const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearStarboardChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearstarboardchannel',
            aliases: ['clearstc', 'cstc'],
            usage: 'clearstarboardchannel',
            description: oneLine`
        clears the starboard text channel for your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearstarboardchannel'],
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
        const starboardChannelId =
            this.client.db.settings.selectStarboardChannelId
                .pluck()
                .get(context.guild.id);
        const oldStarboardChannel =
            context.guild.channels.cache.get(starboardChannelId) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `Starboard`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`starboard channel\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Clear if no args provided
        this.client.db.settings.updateStarboardChannelId.run(
            null,
            context.guild.id
        );

        const payload = {
            embeds: [embed.addField(
                'Starboard Channel',
                `${oldStarboardChannel} ➔ \`None\``
            )],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
