const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearCrownRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearcrownrole',
            aliases: ['clearcr', 'ccr'],
            usage: 'clearcrownrole',
            description: oneLine`
        Clears the role ${client.name} will give to the member with the most points each 24 hours.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearcrownrole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        this.handle(role, interaction, true);
    }

    handle(role, context, isInteraction) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule,
        } = this.client.db.settings.selectCrown.get(context.guild.id);
        const oldCrownRole =
            context.guild.roles.cache.get(crownRoleId) || '`None`';
        const crownChannel = context.guild.channels.cache.get(crownChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(
            crownRoleId,
            crownSchedule
        );

        // Trim message
        if (crownMessage && crownMessage.length > 1024)
            crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Crown`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`crown role\` was successfully cleared. ${success}`
            )
            .addFields([{name: 'Channel', value:  `${crownChannel}` || '`None`', inline:  true}])
            .addField(
                'Schedule',
                `\`${crownSchedule ? crownSchedule : 'None'}\``,
                true
            )
            .addField(
                'Message',
                this.client.utils.replaceCrownKeywords(crownMessage) || '`None`'
            )
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        // Clear role
        this.client.db.settings.updateCrownRoleId.run(null, context.guild.id);
        if (context.guild.job) context.guild.job.cancel(); // Cancel old job

        this.client.logger.info(`${context.guild.name}: Cancelled job`);

        // Update status
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const payload = {
            embeds: [
                embed
                    .spliceFields(0, 0, {
                        name: 'Role',
                        value: `${oldCrownRole} ➔ \`None\``,
                        inline: true,
                    })
                    .spliceFields(3, 0, {name: 'Status', value: statusUpdate}),
            ],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }

};
