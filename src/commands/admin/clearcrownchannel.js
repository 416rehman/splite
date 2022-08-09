const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearCrownChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearcrownchannel', aliases: ['clearcc', 'ccc'], usage: 'clearcrownchannel', description: oneLine`
        clears the crown message text channel for your server.
      `, type: client.types.ADMIN, userPermissions: ['MANAGE_GUILD'], examples: ['clearcrownchannel'],
        });
    }


    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule,
        } = this.client.db.settings.selectCrown.get(context.guild.id);
        const crownRole = context.guild.roles.cache.get(crownRoleId);
        const oldCrownChannel = context.guild.channels.cache.get(crownChannelId) || '`None`';

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Crown`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(`The \`crown channel\` was successfully cleared. ${success}`)
            .addField('Role', crownRole?.toString() || '`None`', true)
            .addField('Schedule', `\`${crownSchedule ? crownSchedule : 'None'}\``, true)
            .addField('Status', '`disabled`')
            // .addField('Message', this.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
            .setFooter({
                text: context.member.displayName, iconURL: context.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        // Clear channel
        this.client.db.settings.updateCrownChannelId.run(null, context.guild.id);

        const payload = {
            embeds: [embed.spliceFields(1, 0, {
                name: 'Channel', value: `${oldCrownChannel} ➔ \`None\``, inline: true,
            }),],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
