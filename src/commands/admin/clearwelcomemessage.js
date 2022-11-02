const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearWelcomeMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearwelcomemessage',
            aliases: ['clearwelcomemsg', 'clearwm', 'cwm', 'cleargreetmessage', 'cleargreetmsg',],
            usage: 'clearwelcomemessage <message>',
            description: oneLine`
        Clears the message ${client.name} will say when someone joins your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearwelcomemessage'],
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
        const {
            welcome_channel_id: welcomeChannelId, welcome_message: oldWelcomeMessage,
        } = this.client.db.settings.selectWelcomes.get(context.guild.id);
        let welcomeChannel = context.guild.channels.cache.get(welcomeChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(welcomeChannelId, oldWelcomeMessage);

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Welcomes`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(`The \`welcome message\` was successfully cleared. ${success}`)
            .addFields([{name: 'Channel', value:  welcomeChannel?.toString() || '`None`', inline:  true}])
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        this.client.db.settings.updateWelcomeMessage.run(null, context.guild.id);

        // Update status
        const status = 'disabled';
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed
                .addFields([{name: 'Status', value:  statusUpdate, inline:  true}])
                .addFields([{name: 'Message', value:  '`None`'}])],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
