const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class SettingsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'settings',
            aliases: ['set', 'config', 'conf'],
            usage: 'settings [category]',
            description: oneLine`
        Displays a list of all current settings for the given setting category. 
        If no category is given, the amount of settings for every category will be displayed.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['settings System'],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(s =>
                    s.setName('setting')
                        .setRequired(false)
                        .setDescription('The setting to view.')
                        .addChoices(
                            {name: 'System', value: 'system'},
                            {name: 'Crown', value: 'crown'},
                            {name: 'Logging', value: 'logging'},
                            {name: 'Verification', value: 'verification'},
                            {name: 'Farewell', value: 'farewell'},
                            {name: 'Welcome', value: 'welcome'},
                            {name: 'Points', value: 'points'},
                            {name: 'JoinVoting', value: 'joinvoting'},
                        ))
        });
    }

    run(message, args) {
        this.handle(args.join(''), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const setting = interaction.options.getString('setting');
        this.handle(setting, interaction, true);
    }

    handle(setting, context, isInteraction) {
        const {trimArray, replaceKeywords, replaceCrownKeywords} = this.client.utils;

        // Set values
        const row = this.client.db.settings.selectRow.get(context.guild.id);

        const prefix = `\`${row.prefix}\``;
        const systemChannel = context.guild.channels.cache.get(row.system_channel_id) || '`None`';
        const joinVotingChannel = context.guild.channels.cache.get(row.voting_channel_id) || '`None`';
        const joinVotingMessage = row.joinvoting_message_id || '`None`';
        //Emoji
        let joinVotingEmoji = this.client.utils.getEmojiForJoinVoting(context.guild, this.client) || '`None`';

        const confessionChannel = context.guild.channels.cache.get(row.confessions_channel_id) || '`None`';
        const starboardChannel = context.guild.channels.cache.get(row.starboard_channel_id) || '`None`';
        const modLog = context.guild.channels.cache.get(row.mod_log_id) || '`None`';
        const memberLog = context.guild.channels.cache.get(row.member_log_id) || '`None`';
        const nicknameLog = context.guild.channels.cache.get(row.nickname_log_id) || '`None`';
        const roleLog = context.guild.channels.cache.get(row.role_log_id) || '`None`';
        const messageEditLog = context.guild.channels.cache.get(row.message_edit_log_id) || '`None`';
        const messageDeleteLog = context.guild.channels.cache.get(row.message_delete_log_id) || '`None`';
        const verificationChannel = context.guild.channels.cache.get(row.verification_channel_id) || '`None`';
        const welcomeChannel = context.guild.channels.cache.get(row.welcome_channel_id) || '`None`';
        const farewellChannel = context.guild.channels.cache.get(row.farewell_channel_id) || '`None`';
        const crownChannel = context.guild.channels.cache.get(row.crown_channel_id) || '`None`';
        let modChannels = [];
        if (row.mod_channel_ids) {
            for (const channel of row.mod_channel_ids.split(' ')) {
                modChannels.push(context.guild.channels.cache.get(channel).toString());
            }
            modChannels = trimArray(modChannels).join(' ');
        }
        if (modChannels.length === 0) modChannels = '`None`';
        const adminRole = context.guild.roles.cache.get(row.admin_role_id) || '`None`';
        const modRole = context.guild.roles.cache.get(row.mod_role_id) || '`None`';
        const muteRole = context.guild.roles.cache.get(row.mute_role_id) || '`None`';
        const autoRole = context.guild.roles.cache.get(row.auto_role_id) || '`None`';
        const verificationRole = context.guild.roles.cache.get(row.verification_role_id) || '`None`';
        const crownRole = context.guild.roles.cache.get(row.crown_role_id) || '`None`';
        const autoKick = row.auto_kick ? `After \`${row.auto_kick}\` warn(s)` : '`disabled`';
        const messagePoints = `\`${row.message_points}\``;
        const commandPoints = `\`${row.command_points}\``;
        const voicePoints = `\`${row.voice_points}\``;
        let verificationMessage = row.verification_message ? replaceKeywords(row.verification_message) : '`None`';
        let welcomeMessage = row.welcome_message ? replaceKeywords(row.welcome_message) : '`None`';
        let farewellMessage = row.farewell_message ? replaceKeywords(row.farewell_message) : '`None`';
        let crownMessage = row.crown_message ? replaceCrownKeywords(row.crown_message) : '`None`';
        let disabledCommands = '`None`';
        if (row.disabled_commands) disabledCommands = row.disabled_commands
            .split(' ')
            .map((c) => `\`${c}\``)
            .join(' ');

        // Get statuses
        const verificationStatus = `\`${this.client.utils.getStatus(row.verification_role_id && row.verification_channel_id && row.verification_message)}\``;
        const randomColor = `\`${this.client.utils.getStatus(row.random_color)}\``;
        const welcomeStatus = `\`${this.client.utils.getStatus(row.welcome_message && row.welcome_channel_id)}\``;
        const farewellStatus = `\`${this.client.utils.getStatus(row.farewell_message && row.farewell_channel_id)}\``;
        const pointsStatus = `\`${this.client.utils.getStatus(row.point_tracking)}\``;
        const crownStatus = `\`${this.client.utils.getStatus(row.crown_role_id && row.crown_schedule)}\``;
        const anonymous = `\`${this.client.utils.getStatus(row.anonymous)}\``;
        const joinVotingStatus = `\`${this.client.utils.getStatus(row.joinvoting_message_id && row.voting_channel_id && row.joinvoting_emoji)}\``;

        // Trim messages to 1024 characters
        if (verificationMessage.length > 1024) verificationMessage = verificationMessage.slice(0, 1021) + '...';
        if (welcomeMessage.length > 1024) welcomeMessage = welcomeMessage.slice(0, 1021) + '...';
        if (farewellMessage.length > 1024) farewellMessage = farewellMessage.slice(0, 1021) + '...';
        if (crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        /** ------------------------------------------------------------------------------------------------
         * CATEGORY CHECKS
         * ------------------------------------------------------------------------------------------------ */
        if (setting) {
            setting = setting?.toLowerCase();
            if (setting.endsWith('setting')) setting = setting.slice(0, -7);

            switch (setting) {
            case 's':
            case 'sys':
            case 'system': {
                const payload = ({
                    embeds: [embed
                        .setTitle('Settings: `System`')
                        .addFields([{name: 'Prefix', value: prefix, inline: true}])
                        .addFields([{name: 'System Channel', value: systemChannel.toString(), inline: true}])
                        .addFields([{name: 'Starboard Channel', value: starboardChannel.toString(), inline: true}])
                        .addFields([{name: 'Admin Role', value: adminRole.toString(), inline: true}])
                        .addFields([{name: 'Mod Role', value: modRole.toString(), inline: true}])
                        .addFields([{name: 'Mute Role', value: muteRole.toString(), inline: true}])
                        .addFields([{name: 'Auto Role', value: autoRole.toString(), inline: true}])
                        .addFields([{name: 'Auto Kick', value: autoKick.toString(), inline: true}])
                        .addFields([{name: 'Random Color', value: randomColor, inline: true}])
                        .addFields([{name: 'Anonymous Messages', value: anonymous, inline: true}])
                        .addFields([{
                            name: 'Confessions Channel',
                            value: confessionChannel.toString(),
                            inline: true
                        }])
                        .addFields([{name: 'Mod Channels', value: modChannels}])
                        .addFields([{name: 'Disabled Commands', value: disabledCommands}]),],
                });

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            case 'l':
            case 'log':
            case 'logs':
            case 'logging': {
                const payload = ({
                    embeds: [embed
                        .setTitle('Settings: `Logging`')
                        .addFields([{name: 'Mod Log', value: modLog.toString(), inline: true}])
                        .addFields([{name: 'Member Log', value: memberLog.toString(), inline: true}])
                        .addFields([{name: 'Nickname Log', value: nicknameLog.toString(), inline: true}])
                        .addFields([{name: 'Role Log', value: roleLog.toString(), inline: true}])
                        .addFields([{name: 'Message Edit Log', value: messageEditLog.toString(), inline: true}])
                        .addFields([{
                            name: 'Message Delete Log',
                            value: messageDeleteLog.toString(),
                            inline: true
                        }]),],
                });

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            case 'v':
            case 'ver':
            case 'verif':
            case 'verification': {
                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Verification`')
                        .addFields([{name: 'Role', value: verificationRole.toString(), inline: true}])
                        .addFields([{name: 'Channel', value: verificationChannel.toString(), inline: true}])
                        .addFields([{name: 'Status', value: verificationStatus.toString(), inline: true}])
                        .addFields([{name: 'Message', value: verificationMessage.toString()}])]
                };

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            case 'w':
            case 'welcome':
            case 'welcomes': {
                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Welcomes`')
                        .addFields([{name: 'Channel', value: welcomeChannel.toString(), inline: true}])
                        .addFields([{name: 'Status', value: welcomeStatus, inline: true}])
                        .addFields([{name: 'Message', value: welcomeMessage}])]
                };

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            case'f':
            case'farewell':
            case'farewells': {
                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Farewells`')
                        .addFields([{name: 'Channel', value: farewellChannel.toString(), inline: true}])
                        .addFields([{name: 'Status', value: farewellStatus, inline: true}])
                        .addFields([{name: 'Message', value: farewellMessage}])]
                };

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            case 'p':
            case 'point':
            case 'points' : {
                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Points`')
                        .addFields([{name: 'Message Points', value: messagePoints, inline: true}])
                        .addFields([{name: 'Command Points', value: commandPoints, inline: true}])
                        .addFields([{name: 'Voice Points', value: voicePoints, inline: true}])
                        .addFields([{name: 'Status', value: pointsStatus}]),]
                };
                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            case 'c':
            case 'crown': {
                if (context.guild.job.nextInvocation()) embed.addFields([{
                    name: 'Next Crown Transfer',
                    value: `\`${context.guild.job.nextInvocation()}\``
                }]);

                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Crown`')
                        .addFields([{name: 'Role', value: crownRole.toString(), inline: true}])
                        .addFields([{name: 'Channel', value: crownChannel.toString(), inline: true}])
                        .addFields([{name: 'Status', value: `${crownStatus}`}])
                        .addFields([{name: 'Message', value: crownMessage}])]
                };

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }

            case 'j':
            case 'join':
            case 'joinvote':
            case 'joinvoting': {
                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Join Voting`')
                        .addFields([{name: 'Status', value: joinVotingStatus}])
                        .addFields([{name: 'Reaction', value: joinVotingEmoji, inline: true}])
                        .addFields([{name: 'MessageID', value: joinVotingMessage, inline: true}])
                        .addFields([{
                            name: 'Vote Broadcast Channel',
                            value: joinVotingChannel.toString(),
                            inline: true
                        }]),]
                };
                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            }

            if (setting) {
                const payload = `${fail} Please enter a valid setting.`;

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
        }

        /** ------------------------------------------------------------------------------------------------
         * FULL SETTINGS
         * ------------------------------------------------------------------------------------------------ */

        const payload = {
            embeds: [embed.setTitle('Settings').setDescription(`**More Information:** \`${row.prefix}settings [category]\``)
                .addFields([{name: 'System', value: '`13` settings', inline: true}])
                .addFields([{name: 'Logging', value: '`6` settings', inline: true}])
                .addFields([{name: 'Verification', value: '`3` settings', inline: true}])
                .addFields([{name: 'Welcomes', value: '`2` settings', inline: true}])
                .addFields([{name: 'Farewells', value: '`2` settings', inline: true}])
                .addFields([{name: 'Points', value: '`3` settings', inline: true}])
                .addFields([{name: 'Crown', value: '`4` settings', inline: true}])
                .addFields([{name: 'JoinVoting', value: '`3` settings', inline: true}])
                .addFields([{
                    name: 'Invite Me',
                    value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot%20applications.commands)`,
                    inline: true
                }])
            ]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
