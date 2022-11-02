const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetNicknameLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setnicknamelog',
            aliases: ['setnnl', 'snnl'],
            usage: 'setnicknamelog <channel mention/ID>',
            description: oneLine`
        Sets the nickname change log text channel for your server. 
        \nUse \`clearnicknamelog\` to clear the current \`nickname log\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setnicknamelog #bot-log', 'clearnicknamelog'],
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
        const nicknameLogId = this.client.db.settings.selectNicknameLogId.pluck().get(context.guild.id);
        const oldNicknameLog = context.guild.channels.cache.get(nicknameLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{name: 'Current Nickname Log', value:  `${oldNicknameLog}`}])
                        .setDescription(this.description),
                ],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);
        if (!channel || channel.type != ChannelType.GuildText || !channel.viewable) {
            const payload = `${fail} Please provide a valid text channel.`;

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }
        this.client.db.settings.updateNicknameLogId.run(channel.id, context.guild.id);
        const payload = ({
            embeds: [
                embed.addField(
                    'Nickname Log',
                    `${oldNicknameLog} ➔ ${channel}`
                ).setDescription(
                    `The \`nickname log\` was successfully updated. ${success}\nUse \`clearnicknamelog\` to clear the current \`nickname log\`.`
                ),
            ],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
