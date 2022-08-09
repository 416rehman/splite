const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
            userPermissions: ['MANAGE_GUILD'],
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

    handle(channel, context, isInteraction) {
        const memberLogId = this.client.db.settings.selectMemberLogId
            .pluck()
            .get(context.guild.id);
        const oldMemberLog =
            context.guild.channels.cache.get(memberLogId) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: context.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Display current member log
        if (!channel) {
            const payload = ({
                embeds: [
                    embed
                        .addField('Current Member Log', `${oldMemberLog}` || '`None`')
                        .setDescription(this.description),
                ],
            });

            if (isInteraction) context.editReply(payload);
            else context.reply(payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || channel.type != 'GUILD_TEXT' || !channel.viewable) {
            const payload = `${fail} Please mention an accessible text channel or provide a valid text channel ID.`;

            if (isInteraction) context.editReply(payload);
            else context.reply(payload);
            return;
        }

        this.client.db.settings.updateMemberLogId.run(channel.id, context.guild.id);

        const payload = ({
            embeds: [
                embed.addField('Member Log', `${oldMemberLog} ➔ ${channel}`)
                    .setDescription(
                        `The \`member log\` was successfully updated. ${success}\nUse \`clearmemberlog\` to clear the current \`member log\`.`
                    ),
            ],
        });

        if (isInteraction) context.editReply(payload);
        else context.reply(payload);
    }
};
