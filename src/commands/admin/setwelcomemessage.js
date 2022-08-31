const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetWelcomeMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setwelcomemessage',
            aliases: ['setwelcomemsg', 'setwm', 'swm', 'setgreetmessage', 'setgreetmsg',],
            usage: 'setwelcomemessage <message>',
            description: oneLine`
        Sets the message ${client.name} will say when someone joins your server.
        You may use \`?member\` to substitute for a user mention,
        \`?username\` to substitute for someone's username,
        \`?tag\` to substitute for someone's full Discord tag (username + discriminator),
        and \`?size\` to substitute for your server's current member count.        
        A \`welcome channel\` must also be set to enable welcome messages.
        \nUse \`clearwelcomemessage\` to clear the current \`welcome message\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setwelcomemessage ?member has joined the server!', 'clearwelcomemessage',],
        });
    }

    run(message, args) {
        let text = args[0] ? message.content.slice(message.content.indexOf(args[0]), message.content.length) : '';
        this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text');
        this.handle(text, interaction, true);
    }

    handle(text, context, isInteraction) {
        const {
            welcome_channel_id: welcomeChannelId, welcome_message: oldWelcomeMessage,
        } = this.client.db.settings.selectWelcomes.get(context.guild.id);
        let welcomeChannel = context.guild.channels.cache.get(welcomeChannelId);

        // Get status
        const oldStatus = this.client.utils.getStatus(welcomeChannelId, oldWelcomeMessage);

        const embed = new MessageEmbed()
            .setTitle('Settings: `Welcomes`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addField('Channel', welcomeChannel?.toString() || '`None`', true)
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        if (!text) {
            const payload = ({
                embeds: [embed
                    .addField('Status', oldStatus, true)
                    .addField('Current Welcome Message', `${oldWelcomeMessage}`)
                    .setDescription(this.description),],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        embed.setDescription(`The \`welcome message\` was successfully updated. ${success}\nUse \`clearwelcomemessage\` to clear the current \`welcome message\`.`);

        this.client.db.settings.updateWelcomeMessage.run(text, context.guild.id);
        if (text.length > 1024) text = text.slice(0, 1021) + '...';

        // Update status
        const status = this.client.utils.getStatus(welcomeChannel, text);
        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = ({
            embeds: [embed
                .addField('Status', statusUpdate, true)
                .addField('Message', this.client.utils.replaceKeywords(text)),],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
