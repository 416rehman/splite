const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetModChannelsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmodchannels',
            aliases: ['setmodcs', 'setmcs', 'smcs'],
            usage: 'setmodchannels <channel mentions/IDs>',
            description: oneLine`
        Sets the moderator only text channels for your server.
        Only \`${client.utils.capitalize(
        client.types.MOD
    )}\` type commands will work in these channels,
        and ${
    client.name
} will only respond to members with permission to use those commands.
        \nUse \`clearmodchannels\` to clear the current \`mod channels\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: [
                'setmodchannels #general #memes #off-topic',
                'clearmodchannels',
            ],
        });
    }

    run(message, args) {
        let channels = [];
        for (const arg of args) {
            const channel = this.getChannelFromMention(message, arg) || message.guild.channels.cache.get(arg);
            if (channel && channel.type === 'GUILD_TEXT' && channel.viewable) channels.push(channel);
            else if (channel) return this.sendErrorMessage(
                message,
                0,
                stripIndent`Please mention only accessible text channels or provide only valid text channel IDs`
            );
        }
        channels = [...new Set(channels)];

        this.handle(channels, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel');
        const channel2 = interaction.options.getChannel('channel2');
        const channel3 = interaction.options.getChannel('channel3');
        const channel4 = interaction.options.getChannel('channel4');
        const channel5 = interaction.options.getChannel('channel5');

        const channels = new Set([channel, channel2, channel3, channel4, channel5]);

        this.handle(channels, interaction, true);
    }

    handle(channels, context, isInteraction) {
        const modChannelIds = this.client.db.settings.selectModChannelIds.pluck().get(context.guild.id);

        let oldModChannels = [];
        if (modChannelIds) {
            for (const channel of modChannelIds.split(' ')) {
                oldModChannels.push(context.guild.channels.cache.get(channel));
            }
            oldModChannels = this.client.utils.trimArray(oldModChannels).join(' ');
        }
        if (oldModChannels.length === 0) oldModChannels = '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: context.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Show current mod channels
        if (!channels) {
            const payload = ({
                embeds: [
                    embed
                        .addField(
                            'Current Mod Channels',
                            `${oldModChannels}` || '`None`'
                        )
                        .setDescription(this.description),
                ],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        const channelIds = channels.map((c) => c.id).join(' '); // Only keep unique IDs
        this.client.db.settings.updateModChannelIds.run(
            channelIds,
            context.guild.id
        );
        const payload = ({
            embeds: [
                embed.addField(
                    'Mod Channels',
                    `${oldModChannels} ➔ ${this.client.utils.trimArray(channels).join(' ')}`
                ).setDescription(
                    `The \`mod channels\` were successfully updated. ${success}\nUse \`clearmodchannels\` to clear the current \`mod channels\`.`
                ),
            ],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
