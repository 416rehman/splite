const Command = require('../Command.js');
const {EmbedBuilder, GatewayIntentBits, ChannelType} = require('discord.js');
const moment = require('moment');
const {owner, voice} = require('../../utils/emojis.json');
const {stripIndent} = require('common-tags');

module.exports = class ServerInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'serverinfo',
            aliases: ['server', 'si'],
            usage: 'serverinfo',
            description: 'Fetches information and statistics about the server.',
            type: client.types.INFO,
        });
    }

    run(message) {
        const guild = message.guild;
        this.handle(guild, message, false);
    }

    async interact(interaction) {
        const guild = interaction.guild;
        await interaction.deferReply();
        await this.handle(guild, interaction, true);
    }

    async handle(guild, context, isInteraction) {
        // Get roles count
        const roleCount = guild.roles.cache.size - 1; // Don't count @everyone

        // Get member stats
        const members = [...(await guild.members.fetch()).values()];
        const memberCount = members.length;
        const online = members.filter((m) => m.presence?.status === 'online').length;
        const offline = members.filter((m) => m.presence?.status === 'offline').length;
        const dnd = members.filter((m) => m.presence?.status === 'dnd').length;
        const afk = members.filter((m) => m.presence?.status === 'idle').length;
        const bots = members.filter((b) => b.user.bot).length;

        const intentIsEnabled = this.client.intents.find(i => i === GatewayIntentBits.GuildPresences);

        // Get channel stats
        const channels = [...guild.channels.cache.values()];
        const channelCount = channels.length;

        const textChannels = channels
            .filter((c) => c.type === ChannelType.GuildText && c.viewable)
            .sort((a, b) => a.rawPosition - b.rawPosition);
        const voiceChannels = channels.filter((c) => c.type === ChannelType.GuildVoice).length;
        const newsChannels = channels.filter((c) => c.type === ChannelType.GuildNews).length;
        const categoryChannels = channels.filter((c) => c.type === ChannelType.GuildCategory).length;

        const systemchannel = this.client.db.settings.selectSystemChannelId
            .pluck()
            .get(guild.id);
        const serverStats = stripIndent`
      Members  :: [ ${memberCount} ]
               :: ${bots} Bots
               ` + (intentIsEnabled ? `:: ${online} Online
               :: ${dnd} Busy
               :: ${afk} AFK
               :: ${offline} Offline` : '\n') +
            stripIndent`
            
      Channels :: [ ${channelCount} ]
               :: ${textChannels.length} Text
               :: ${voiceChannels} Voice
               :: ${newsChannels} Announcement
               :: ${categoryChannels} Category
      Roles    :: [ ${roleCount} ]
    `;

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name}'s Information`)
            .setThumbnail(guild.iconURL({dynamic: true}))
            .addFields([{name: 'ID', value:  `\`${guild.id}\``, inline:  true}])

            .addFields([{name: `Owner ${owner}`, value:  (await guild.fetchOwner()).toString(), inline:  true}])
            .addFields([{name: 'Verification Level', value: `\`${guild.verificationLevel.replace('_', ' ')}\``, inline:  true}])
            .addFields([{name: 'Rules Channel', value:  guild.rulesChannel ? `${guild.rulesChannel}` : '`None`', inline:  true}])
            .addFields([{name: 'System Channel', value:  systemchannel ? `<#${systemchannel}>` : '`None`', inline:  true}])
            .addFields([{name: 'AFK Channel', value:  guild.afkChannel ? `${voice} ${guild.afkChannel.name}` : '`None`', inline:  true}])
            .addFields([{
                name: 'AFK Timeout',
                value: guild.afkChannel ? `\`${moment.duration(guild.afkTimeout * 1000).asMinutes()} minutes\`` : '`None`',
                inline: true
            }])

            .addFields([{name: 'Default Notifications', value: `\`${guild.defaultMessageNotifications.replace('_', ' ')}\``, inline:  true}])
            .addFields([{name: 'Partnered', value:  `\`${guild.partnered}\``, inline:  true}])
            .addFields([{name: 'Verified', value:  `\`${guild.verified}\``, inline:  true}])
            .addFields([{name: 'Created On', value:  `\`${moment(guild.createdAt).format('MMM DD YYYY')}\``, inline:  true}])
            .addFields([{name: 'Server Stats', value:  `\`\`\`asciidoc\n${serverStats}\`\`\``}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        if (guild.description) embed.setDescription(guild.description);
        if (guild.bannerURL) embed.setImage(guild.bannerURL({dynamic: true}));

        const payload = {embeds: [embed]};

        if (isInteraction) await context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
