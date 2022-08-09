const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearModChannelsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmodchannels',
            aliases: ['clearmodcs', 'clearmcs', 'cmcs'],
            usage: 'clearmodchannels',
            description: oneLine`
        Clears the moderator only text channels for your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearmodchannels'],
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
        const {trimArray} = this.client.utils;
        const modChannelIds = this.client.db.settings.selectModChannelIds
            .pluck()
            .get(context.guild.id);
        let oldModChannels = [];
        if (modChannelIds) {
            for (const channel of modChannelIds.split(' ')) {
                oldModChannels.push(context.guild.channels.cache.get(channel));
            }
            oldModChannels = trimArray(oldModChannels).join(' ');
        }
        if (oldModChannels.length === 0) oldModChannels = '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`mod channels\` were successfully clear. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateModChannelIds.run(
            null,
            context.guild.id
        );

        const payload = {embeds: [embed.addField('Mod Channels', `${oldModChannels} ➔ \`None\``)]};

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
