const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('@discordjs/builders');
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
            slashCommand: new SlashCommandBuilder().addStringOption(s => s.setName('setting').setRequired(false).setDescription('The setting to view.').addChoices([['System', 'system'], ['Crown', 'crown'], ['Logging', 'logging'], ['Verification', 'verification'], ['Farewell', 'farewell'], ['Welcome', 'welcome'], ['Points', 'points'], ['JoinVoting', 'joinvoting'],]))
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

        const embed = new MessageEmbed()
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
                        .addField('Prefix', prefix, true)
                        .addField('System Channel', systemChannel.toString(), true)
                        .addField('Starboard Channel', starboardChannel.toString(), true)
                        .addField('Admin Role', adminRole.toString(), true)
                        .addField('Mod Role', modRole.toString(), true)
                        .addField('Mute Role', muteRole.toString(), true)
                        .addField('Auto Role', autoRole.toString(), true)
                        .addField('Auto Kick', autoKick.toString(), true)
                        .addField('Random Color', randomColor, true)
                        .addField('Anonymous Messages', anonymous, true)
                        .addField('Confessions Channel', confessionChannel.toString(), true)
                        .addField('Mod Channels', modChannels)
                        .addField('Disabled Commands', disabledCommands),],
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
                        .addField('Mod Log', modLog.toString(), true)
                        .addField('Member Log', memberLog.toString(), true)
                        .addField('Nickname Log', nicknameLog.toString(), true)
                        .addField('Role Log', roleLog.toString(), true)
                        .addField('Message Edit Log', messageEditLog.toString(), true)
                        .addField('Message Delete Log', messageDeleteLog.toString(), true),],
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
                        .addField('Role', verificationRole.toString(), true)
                        .addField('Channel', verificationChannel.toString(), true)
                        .addField('Status', verificationStatus.toString(), true)
                        .addField('Message', verificationMessage.toString())]
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
                        .addField('Channel', welcomeChannel.toString(), true)
                        .addField('Status', welcomeStatus, true)
                        .addField('Message', welcomeMessage)]
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
                        .addField('Channel', farewellChannel.toString(), true)
                        .addField('Status', farewellStatus, true)
                        .addField('Message', farewellMessage)]
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
                        .addField('Message Points', messagePoints, true)
                        .addField('Command Points', commandPoints, true)
                        .addField('Voice Points', voicePoints, true)
                        .addField('Status', pointsStatus),]
                };
                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
                return;
            }
            case 'c':
            case 'crown': {
                if (context.guild.job.nextInvocation()) embed.addField('Next Crown Transfer', `\`${context.guild.job.nextInvocation()}\``);

                const payload = {
                    embeds: [embed
                        .setTitle('Settings: `Crown`')
                        .addField('Role', crownRole.toString(), true)
                        .addField('Channel', crownChannel.toString(), true)
                        .addField('Status', `${crownStatus}`)
                        .addField('Message', crownMessage)]
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
                        .addField('Status', joinVotingStatus)
                        .addField('Reaction', joinVotingEmoji, true)
                        .addField('MessageID', joinVotingMessage, true)
                        .addField('Vote Broadcast Channel', joinVotingChannel.toString(), true),]
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
                .addField('System', '`13` settings', true)
                .addField('Logging', '`6` settings', true)
                .addField('Verification', '`3` settings', true)
                .addField('Welcomes', '`2` settings', true)
                .addField('Farewells', '`2` settings', true)
                .addField('Points', '`3` settings', true)
                .addField('Crown', '`4` settings', true)
                .addField('JoinVoting', '`3` settings', true)
                .addField('Invite Me', `[Click Here](${this.client.config.inviteLink})`, true)
            ]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
