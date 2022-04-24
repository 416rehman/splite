const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, verify, fail} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class clearJoinVoting extends Command {
    constructor(client) {
        super(client, {
            name: 'clearjoinvoting',
            aliases: ['clearjoingate', 'clearjoinvoting', 'cjv'],
            usage: `clearjoinvoting`,
            description: oneLine`Disables the join voting feature`,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearjoinvoting']
        });
    }

    async run(message, args) {
        let {
            joinvoting_message_id: joinvotingMessageId,
            joinvoting_emoji: joinvotingEmoji,
            voting_channel_id: votingChannelID
        } = message.client.db.settings.selectJoinVotingMessage.get(message.guild.id);

        // Get status
        const oldStatus = message.client.utils.getStatus(
            joinvotingMessageId && joinvotingEmoji && votingChannelID
        );

        message.client.db.settings.updateJoinVotingEmoji.run(null, message.guild.id);
        message.client.db.settings.updateJoinVotingMessageId.run(null, message.guild.id);
        message.client.db.settings.updateVotingChannelID.run(null, message.guild.id);

        // Update status
        const status = 'disabled';
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const embed = new MessageEmbed()
            .setTitle('Settings: `Join Voting`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(`The \`join voting system\` has been cleared. ${success}`)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        return message.channel.send({
                embeds: [embed
                    .addField('Status', statusUpdate, true)
                    .addField('Message', '`None`')]
            }
        );
    }
};
