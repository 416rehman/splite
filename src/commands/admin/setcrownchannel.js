const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');

module.exports = class SetCrownChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownchannel',
            aliases: ['setcc', 'scc'],
            usage: 'setcrownchannel <channel mention/ID>',
            description: oneLine`
        Sets the crown message text channel for your server. 
        \nUse \`clearcrownchannel\` to clear the current \`crown channel\`.
        A \`crown message\` will only be sent if a \`crown channel\`, and \`crown role\` are both set.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setcrownchannel #general', 'clearcrownchannel'],
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

    handle(target, context, isInteraction) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule,
        } = this.client.db.settings.selectCrown.get(context.guild.id);

        const crownRole = context.guild.roles.cache.get(crownRoleId);
        const oldCrownChannel = context.guild.channels.cache.get(crownChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(crownRoleId, crownChannelId);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Crown`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addField('Role', crownRole?.toString() || '`None`', true)
            .addField('Schedule', `\`${crownSchedule ? crownSchedule : 'None'}\``, true)
            .addField('Status', `\`${oldStatus}\``)
            .addField('Message', this.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (!target) {
            return context.channel.send({
                embeds: [embed
                    .spliceFields(1, 0, {
                        name: 'Current Crown Channel', value: `${oldCrownChannel}` || '`None`', inline: true,
                    })
                    .spliceFields(3, 0, {
                        name: 'Status', value: oldStatus
                    })
                    .setDescription(this.description)
                ],
            });
        }
        embed.setDescription(`The \`crown channel\` was successfully updated. ${success}\nUse \`clearcrownchannel\` to clear the current \`crown channel\`.`);
        const crownChannel = isInteraction ? target : this.getChannelFromMention(context, target) || context.guild.channels.cache.get(target);
        if (!crownChannel || (crownChannel.type !== 'GUILD_TEXT' && crownChannel.type !== 'GUILD_NEWS') || !crownChannel.viewable) {
            const payload = emojis.fail + ' Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID.';
            if (isInteraction) return context.editReply(payload);
            else return context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }

        this.client.db.settings.updateCrownChannelId.run(crownChannel.id, context.guild.id);

        // Update status
        const status = this.client.utils.getStatus(crownRole, crownChannelId);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed.spliceFields(1, 0, {
                name: 'Channel', value: `${oldCrownChannel} ➔ ${crownChannel}`, inline: true,
            }).spliceFields(3, 0, {name: 'Status', value: statusUpdate}),],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);

        // Schedule crown role rotation
        this.client.utils.scheduleCrown(this.client, context.guild);
    }
};
