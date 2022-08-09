const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class setJoinVoting extends Command {
    constructor(client) {
        super(client, {
            name: 'setjoinvoting',
            aliases: ['joingate', 'joinvoting', 'sjv'],
            usage: 'setjoinvoting <messageID> <emoji> <votingChannel>',
            description: oneLine`
        Reacts to the provided message with the specified emoji\nIf someone reacts to the emoji, a vote will start in the votingChannel.\nThe person that reacted will either be banned or \nleft alone depending on how many votes they received.\n\n**Useful if you are setting an 18+ server, anyone that\n reacts to the -18 emoji will initiate a vote.**\nUse \`clearJoinVoting\` to disable`,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: [
                'setjoinvoting 832878346979377193 🦶 #generalChannel',
                'clearjoinvoting',
            ],
        });
    }

    run(message, args) {
        const messageID = args[0];
        const emoji = args[1];
        const channel = this.getChannelFromMention(message, args[2]) || message.guild.channels.cache.get(args[2]);

        this.handle(messageID, emoji, channel, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();

        const messageID = interaction.options.getString('messageID');
        const emoji = interaction.options.getString('emoji');
        const channel = interaction.options.getChannel('channel');

        this.handle(messageID, emoji, channel, interaction, true);
    }

    async handle(messageId, emoji, channel, context, isInteraction) {
        let {
            joinvoting_message_id: joinvotingMessageId,
            joinvoting_emoji: joinvotingEmoji,
            voting_channel_id: votingChannelID,
        } = this.client.db.settings.selectJoinVotingMessage.get(context.guild.id);

        // Get status
        const oldStatus = this.client.utils.getStatus(joinvotingMessageId && joinvotingEmoji && votingChannelID);

        // Show current settings
        if (!messageId || !emoji || !channel) {
            const embed = new MessageEmbed()
                .setTitle('Settings: `Join Voting`')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setDescription(this.description)
                .addField('Usage', `\`${this.usage}\``)
                .setFooter({
                    text: context.member.displayName,
                    iconURL: context.author.displayAvatarURL(),
                })
                .setTimestamp()
                .setColor(context.guild.me.displayHexColor);

            const emoji = (await context.guild.emojis.cache.find((e) => e.id === joinvotingEmoji)) || joinvotingEmoji;

            const payload = ({
                embeds: [
                    embed
                        .addField('Status', oldStatus, true)
                        .addField(
                            'Current MessageID',
                            `\`${joinvotingMessageId || 'None'}\``
                        )
                        .addField('Current Emoji', `${emoji || '`None`'}`)
                        .addField(
                            'Current ChannelID',
                            `${
                                votingChannelID
                                    ? '<#' + votingChannelID + '>'
                                    : '`None`'
                            }`
                        ),
                ],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
        }
        else {
            let parsedEmoji,
                emojiValue = null,
                joinVotingMessage;

            //messageID
            if (/^[0-9]{18}$/g.test(messageId)) {
                try {
                    joinVotingMessage = await context.channel.messages.fetch(messageId);
                }
                catch (err) {
                    const payload = `${fail} I could not find the message with the ID \`${messageId}\``;

                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                    return;
                }

            }
            else {
                const payload = isInteraction ? `${fail} Please provide a valid messageID. A messageID is a 18 digit number that can be found by right clicking a message and selecting "Copy ID".`
                    : `${fail} First argument needs to be a messageID. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            //Built-in Emojis
            if (/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu.test(emoji)) {
                parsedEmoji = emoji;
                emojiValue = emoji;
            }
            //Custom Emojis
            else if (/<a?:.+:\d+>/gm.test(emoji)) {
                try {
                    let id = emoji.split(':');
                    id = id.reverse()[0];
                    id = id.replace('>', '');
                    parsedEmoji = await context.guild.emojis.cache.find(
                        (e) => e.id === id
                    );
                    emojiValue = id;
                }
                catch (err) {
                    const payload = `${fail} I could not find the emoji with the ID \`${emoji}\``;

                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                    return;
                }
            }
            else {
                const payload = isInteraction ? `${fail} Please provide a valid emoji.` : `${fail} Second argument needs to be an emoji. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            //VotingChannelID
            channel = isInteraction ? channel : this.getChannelFromMention(context, channel);
            if (!channel) {
                const payload = isInteraction ? `${fail} Please provide a valid channel.` : `${fail} Third argument needs to be a channel. Example: setjoinvoting 832878346979377193 🦶 #generalChannel`;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            if (!channel || (channel.type != 'GUILD_TEXT' && channel.type != 'GUILD_NEWS') || !channel.viewable) {
                const payload = `${fail} The channel you provided is not a text channel.`;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }


            try {
                await joinVotingMessage.react(parsedEmoji);
            }
            catch (err) {
                const payload = `${fail} I could not react to the message with the ID \`${messageId}\``;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            this.client.db.settings.updateJoinVotingMessageId.run(
                messageId,
                context.guild.id
            );
            this.client.db.settings.updateJoinVotingEmoji.run(
                emojiValue,
                context.guild.id
            );
            this.client.db.settings.updateVotingChannelID.run(
                channel.id,
                context.guild.id
            );

            const embed = new MessageEmbed()
                .setTitle('Settings: `Join Voting`')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setDescription(
                    `The \`join voting system\` was successfully updated. ${success}\nUse \`clearJoinVoting\` to disable. If someone reacts with the ${parsedEmoji} emoji you set, the voting will start in the ${channel} channel.`
                )
                .addField('Status', '`enabled`', true)
                .addField('message ID', `\`${messageId}\``)
                .addField('Voting Channel', `${channel}`, true)
                .setFooter({
                    text: context.member.displayName,
                    iconURL: context.author.displayAvatarURL(),
                })
                .setTimestamp();

            if (isInteraction) context.editReply(embed);
            else context.loadingMessage ? context.loadingMessage.edit(embed) : context.reply(embed);
        }
    }
};
