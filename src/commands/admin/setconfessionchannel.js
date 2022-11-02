const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class setconfessionchannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setconfessionchannel',
            aliases: ['setconfessions', 'sconfessions', 'setconfessionschannel'],
            usage: 'setconfessionchannel <channel mention/ID>',
            description: oneLine`
        Sets the confessions text channel for your server. This is where confessions will be sent. 
        \nUse \`clearconfessionschannel\` to clear the current \`confessions channel\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setconfessionchannel #general', 'clearconfessionchannel'],
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
        const confessionsChannelID =
            this.client.db.settings.selectConfessionsChannelId
                .pluck()
                .get(context.guild.id);

        const oldConfessionsChannel =
            context.guild.channels.cache.get(confessionsChannelID) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        // Display current confessions channel
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addField(
                            'Current Confessions Channel',
                            `${oldConfessionsChannel}` || '`None`'
                        )
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

        this.client.db.settings.updateConfessionsChannelId.run(
            channel.id,
            context.guild.id
        );

        const payload = ({
            embeds: [
                embed.addField(
                    'Confessions Channel',
                    `${oldConfessionsChannel} ➔ ${channel}`
                ).setDescription(
                    `The \`confessions channel\` was successfully updated. ${success}\nUse \`clearconfessionschannel\` to clear the current \`confessions channel\`.`
                ),
            ],
        });


        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
