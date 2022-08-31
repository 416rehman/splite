const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
        this.handle(guild, interaction, true);
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

        const intentIsEnabled = this.client.enabledIntents.find(i => i === this.client.intents.GUILD_PRESENCES);

        // Get channel stats
        const channels = [...guild.channels.cache.values()];
        const channelCount = channels.length;

        const textChannels = channels
            .filter((c) => c.type === 'GUILD_TEXT' && c.viewable)
            .sort((a, b) => a.rawPosition - b.rawPosition);
        const voiceChannels = channels.filter((c) => c.type === 'GUILD_VOICE').length;
        const newsChannels = channels.filter((c) => c.type === 'GUILD_NEWS').length;
        const categoryChannels = channels.filter((c) => c.type === 'GUILD_CATEGORY').length;

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

        const embed = new MessageEmbed()
            .setTitle(`${guild.name}'s Information`)
            .setThumbnail(guild.iconURL({dynamic: true}))
            .addField('ID', `\`${guild.id}\``, true)

            .addField(`Owner ${owner}`, (await guild.fetchOwner()).toString(), true)
            .addField('Verification Level', `\`${guild.verificationLevel.replace('_', ' ')}\``, true)
            .addField('Rules Channel', guild.rulesChannel ? `${guild.rulesChannel}` : '`None`', true)
            .addField('System Channel', systemchannel ? `<#${systemchannel}>` : '`None`', true)
            .addField('AFK Channel', guild.afkChannel ? `${voice} ${guild.afkChannel.name}` : '`None`', true)
            .addField('AFK Timeout', guild.afkChannel ? `\`${moment
                .duration(guild.afkTimeout * 1000)
                .asMinutes()} minutes\`` : '`None`', true)

            .addField('Default Notifications', `\`${guild.defaultMessageNotifications.replace('_', ' ')}\``, true)
            .addField('Partnered', `\`${guild.partnered}\``, true)
            .addField('Verified', `\`${guild.verified}\``, true)
            .addField('Created On', `\`${moment(guild.createdAt).format('MMM DD YYYY')}\``, true)
            .addField('Server Stats', `\`\`\`asciidoc\n${serverStats}\`\`\``)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        if (guild.description) embed.setDescription(guild.description);
        if (guild.bannerURL) embed.setImage(guild.bannerURL({dynamic: true}));

        const payload = {embeds: [embed]};

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
