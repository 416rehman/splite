const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetStarboardChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setstarboardchannel',
            aliases: ['setstc', 'sstc'],
            usage: 'setstarboardchannel <channel mention/ID>',
            description: oneLine`
        Sets the starboard text channel for your server.
        \nUse \`clearstarboardchannel\` to clear the current \`starboard channel\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setstarboardchannel #starboard', 'clearstarboardchannel'],
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
        const starboardChannelId = this.client.db.settings.selectStarboardChannelId.pluck().get(context.guild.id);
        const oldStarboardChannel = context.guild.channels.cache.get(starboardChannelId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Starboard`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Show current starboard channel
        if (!channel) {
            return context.channel.send({
                embeds: [
                    embed
                        .addFields({
                            name: 'Current Starboard Channel',
                            value: `${oldStarboardChannel}`
                        })
                        .setDescription(this.description),
                ],
            });
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildNews) || !channel.viewable) {
            const payload = `${fail} I can't find that channel.`;
            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateStarboardChannelId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed.addFields({
                    name: 'Starboard Channel',
                    value: `${oldStarboardChannel} ➔ ${channel}`
                }).setDescription(
                    `The \`starboard channel\` was successfully updated. ${success}\nUse \`clearstarboardchannel\` to clear the current \`starboard channel\``
                ),
            ],
        });

        this.sendReply(context, payload);
    }
};
