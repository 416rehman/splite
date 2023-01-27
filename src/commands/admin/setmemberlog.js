const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetMemberLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmemberlog',
            aliases: ['setmeml', 'smeml'],
            usage: 'setmemberlog <channel mention/ID>',
            description: oneLine`
        Sets the member join/leave log text channel for your server. 
        \nUse \`clearmemberlog\` to clear the current \`member log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setmemberlog #member-log', 'clearmemberlog'],
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

    async handle(channel, context, isInteraction) {
        const memberLogId = this.client.db.settings.selectMemberLogId
            .pluck()
            .get(context.guild.id);
        const oldMemberLog =
            context.guild.channels.cache.get(memberLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Display current member log
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{name: 'Current Member Log', value: `${oldMemberLog}` || '`None`'}])
                        .setDescription(this.description),
                ],
            });

            this.sendReply(context, payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} Please mention an accessible text channel or provide a valid text channel ID.`;

            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateMemberLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed.addFields([{name: 'Member Log', value: `${oldMemberLog} ➔ ${channel}`}])
                    .setDescription(
                        `The \`member log\` was successfully updated. ${success}\nUse \`clearmemberlog\` to clear the current \`member log\`.`
                    ),
            ],
        });

        await this.sendReplyAndDelete(context, payload);
    }
};
