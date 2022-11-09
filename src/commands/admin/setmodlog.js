const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetModLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmodlog',
            aliases: ['setml', 'sml'],
            usage: 'setmodlog <channel mention/ID>',
            description: oneLine`
        Sets the mod log text channel for your server. 
        \nUse \`clearmodlog\` to clear the current \`mod log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmodlog #mod-log', 'clearmodlog'],
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
        const modLogId = this.client.db.settings.selectModLogId
            .pluck()
            .get(context.guild.id);
        const oldModLog = context.guild.channels.cache.get(modLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Show current mod log
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{name: 'Current Mod Log', value:  `${oldModLog}` || '`None`'}])
                        .setDescription(this.description),
                ],
            });

            this.sendReply(context, payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} The channel you provided is invalid. Please provide a valid text channel.`;
            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateModLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [embed
                .addFields([{name: 'Mod Log', value:  `${oldModLog} ➔ ${channel}`}])
                .setDescription(
                    `The \`mod log\` was successfully updated. ${success}\nUse \`clearmodlog\` to clear the current \`mod log\`.`
                )],
        });

        this.sendReply(context, payload);
    }
};
