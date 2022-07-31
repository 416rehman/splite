const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');

module.exports = class SetCrownRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownrole',
            aliases: ['setcr', 'scr'],
            usage: 'setcrownrole <role mention/ID>',
            description: oneLine`
        Sets the role ${client.name} will give to the member with the most points each 24 hours.
        \nUse \`clearcrownrole\` to clear the current \`crown role\`.
        To disable the crown feature, run this command without providing a role.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setcrownrole @Crowned', 'clearcrownrole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const prefix = interaction.options.getRole('role');
        this.handle(prefix, interaction, true);
    }

    async handle(role, context, isInteraction) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule,
        } = this.client.db.settings.selectCrown.get(context.guild.id);
        const oldCrownRole = context.guild.roles.cache.get(crownRoleId) || '`None`';
        const crownChannel = context.guild.channels.cache.get(crownChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(crownRoleId, crownChannelId);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Crown`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addField('Channel', crownChannel?.toString() || '`None`', true)
            .addField('Schedule', `\`${crownSchedule ? crownSchedule : 'None'}\``, true)
            .addField('Message', this.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
            .setFooter({
                text: context.member.displayName, iconURL: context.author.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (!role) {
            const payload = {
                embeds: [
                    embed
                        .spliceFields(0, 0, {
                            name: 'Current Crown Role', value: `${oldCrownRole}` || '`None`', inline: true,
                        })
                        .spliceFields(3, 0, {
                            name: 'Status', value: `\`${oldStatus}\``,
                        })
                        .setDescription(this.description),
                ]
            };

            if (isInteraction) return context.editReply(payload);
            else return context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }

        // Update role
        embed.setDescription(`The \`crown role\` was successfully updated. ${success}\nUse \`clearcrownrole\` to clear the current \`crown role\`.`);

        const crownRole = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!crownRole) {
            const payload = emojis.fail + ' Please mention a role or provide a valid role ID.';
            if (isInteraction) return context.editReply(payload);
            else return context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }

        this.client.db.settings.updateCrownRoleId.run(crownRole.id, context.guild.id);

        // Update status
        const status = this.client.utils.getStatus(crownRole, crownChannelId);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [
                embed.spliceFields(0, 0, {
                    name: 'Role', value: `${oldCrownRole} ➔ ${crownRole}`, inline: true,
                }).spliceFields(3, 0, {name: 'Status', value: statusUpdate}),
            ]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);

        // Schedule crown role rotation
        this.client.utils.scheduleCrown(this.client, context.guild);
    }
};
