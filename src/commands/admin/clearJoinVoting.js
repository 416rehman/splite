const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearJoinVoting extends Command {
    constructor(client) {
        super(client, {
            name: 'clearjoinvoting',
            aliases: ['clearjoingate', 'clearjoinvoting', 'cjv'],
            usage: 'clearjoinvoting',
            description: oneLine`Disables the join voting feature`,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearjoinvoting'],
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
            joinvoting_message_id: joinvotingMessageId,
            joinvoting_emoji: joinvotingEmoji,
            voting_channel_id: votingChannelID,
        } = this.client.db.settings.selectJoinVotingMessage.get(
            context.guild.id
        );

        // Get status
        const oldStatus = this.client.utils.getStatus(
            joinvotingMessageId && joinvotingEmoji && votingChannelID
        );

        this.client.db.settings.updateJoinVotingEmoji.run(
            null,
            context.guild.id
        );
        this.client.db.settings.updateJoinVotingMessageId.run(
            null,
            context.guild.id
        );
        this.client.db.settings.updateVotingChannelID.run(
            null,
            context.guild.id
        );

        // Update status
        const status = 'disabled';
        const statusUpdate =
            oldStatus != status
                ? `\`${oldStatus}\` ➔ \`${status}\``
                : `\`${oldStatus}\``;

        const embed = new MessageEmbed()
            .setTitle('Settings: `Join Voting`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`join voting system\` has been cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const payload = {
            embeds: [embed
                .addField('Status', statusUpdate, true)
                .addField('Message', '`None`'),],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
