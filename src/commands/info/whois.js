const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

const statuses = {
    online: `${emojis.online} \`Online\``,
    idle: `${emojis.idle} \`AFK\``,
    offline: `${emojis.offline} \`Offline\``,
    dnd: `${emojis.dnd} \`Do Not Disturb\``,
};
const flags = {
    DISCORD_EMPLOYEE: `${emojis.discord_employee} \`Discord Employee\``,
    PARTNERED_SERVER_OWNER: `${emojis.discord_partner} \`Partnered Server Owner\``,
    BUGHUNTER_LEVEL_1: `${emojis.bughunter_level_1} \`Bug Hunter (Level 1)\``,
    BUGHUNTER_LEVEL_2: `${emojis.bughunter_level_2} \`Bug Hunter (Level 2)\``,
    HYPESQUAD_EVENTS: `${emojis.hypesquad_events} \`HypeSquad Events\``,
    HOUSE_BRAVERY: `${emojis.house_bravery} \`House of Bravery\``,
    HOUSE_BRILLIANCE: `${emojis.house_brilliance} \`House of Brilliance\``,
    HOUSE_BALANCE: `${emojis.house_balance} \`House of Balance\``,
    EARLY_SUPPORTER: `${emojis.early_supporter} \`Early Supporter\``,
    TEAM_USER: 'Team User',
    SYSTEM: 'System',
    VERIFIED_BOT: `${emojis.verified_bot} \`Verified Bot\``,
    EARLY_VERIFIED_BOT_DEVELOPER: `${emojis.verified_developer} \`Early Verified Bot Developer\``,
    BOT_MANAGER: `${emojis.manager} \`Bot Manager\``,
    BOT_OWNER: `${emojis.owner} \`Bot Owner\``,
};

const elevatedPerms = ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_MESSAGES', 'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS_AND_STICKERS',];

module.exports = class WhoIsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'whois',
            aliases: ['userinfo', 'user', 'ui', 'who', 'info'],
            usage: 'whois [user mention/ID]',
            description: 'Fetches a user\'s information. If no user is given, your own information will be displayed.',
            type: client.types.INFO,
            examples: ['whois @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setRequired(false).setDescription('The user to get information for.').setName('user')),
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]) || message.member;

        this.handle(member, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        let user = interaction.options.getUser('user') ? await this.getGuildMember(interaction.guild, (interaction.options.getUser('user')).id) : interaction.member;
        this.handle(user, interaction, true);
    }

    async handle(targetUser, context, isInteraction) {
        const userFlags = (await targetUser.user.fetchFlags()).toArray();
        if (this.client.getOwnerFromId(targetUser.id)) userFlags.push('BOT_OWNER');
        if (this.client.getManagerFromId(targetUser.id)) userFlags.push('BOT_MANAGER');
        const activities = [];
        let customStatus;
        if (targetUser.presence?.activities) {
            for (const activity of targetUser.presence.activities.values()) {
                switch (activity.type) {
                case 'PLAYING':
                    activities.push(`Playing **${activity.name}**`);
                    break;
                case 'LISTENING':
                    if (targetUser.user.bot) activities.push(`Listening to **${activity.name}**`); else activities.push(`Listening to **${activity.details}** by **${activity.state}**`);
                    break;
                case 'WATCHING':
                    activities.push(`Watching **${activity.name}**`);
                    break;
                case 'STREAMING':
                    activities.push(`Streaming **${activity.name}**`);
                    break;
                case 'CUSTOM_STATUS':
                    customStatus = activity.state;
                    break;
                }
            }
        }
        //Key Perms
        const KeyPerms = targetUser.permissions
            .toArray()
            .filter((p) => elevatedPerms.includes(p));
        if (KeyPerms.includes('ADMINISTRATOR')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'ADMINISTRATOR'), 0);
        if (KeyPerms.includes('MANAGE_GUILD') && KeyPerms.includes('ADMINISTRATOR')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'MANAGE_GUILD'), 1); else if (KeyPerms.includes('MANAGE_GUILD')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'MANAGE_GUILD'), 0);
        // Trim roles
        let roles = this.client.utils.trimArray([...targetUser.roles.cache.values()].filter((r) => !r.name.startsWith('#')));
        roles = this.client.utils
            .removeElement(roles, targetUser.guild.roles.everyone)
            .sort((a, b) => b.position - a.position)
            .join(' ');
        const embed = new MessageEmbed()
            .setTitle(`${targetUser.displayName}'s Information`)
            .setThumbnail(this.getAvatarURL(targetUser.user))
            .addField('User', targetUser.toString(), true)
            .addField('Discriminator', `\`#${targetUser.user.discriminator}\``, true)
            .addField('ID', `\`${targetUser.id}\``, true)
            .addField('Bot', `\`${targetUser.user.bot}\``, true)
            .addField('Voted on Top.gg', (await this.client.utils.checkTopGGVote(
                this.client,
                targetUser.id
            )) ? 'Yes' : 'No', true)
            .addField('Highest Role', targetUser.roles.highest.toString(), true)
            .addField('Joined server on', `\`${moment(targetUser.joinedAt).format('MMM DD YYYY')}\``, true)
            .addField('Joined Discord on', `\`${moment(targetUser.user.createdAt).format('MMM DD YYYY')}\``, true)
            .setFooter({
                text: context.member.displayName, iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (this.client.enabledIntents.find(i => i === this.client.intents.GUILD_PRESENCES)) await embed.addField('Status', statuses[targetUser.presence?.status || 'offline'], true);
        if (activities.length > 0) embed.setDescription(activities.join('\n'));
        if (customStatus) await embed.spliceFields(0, 0, {
            name: 'Custom Status', value: customStatus,
        });
        if (userFlags.length > 0) await embed.addField('Badges', userFlags.map((flag) => flags[flag]).join('\n'), true);
        await embed.addField('Roles', roles || '`None`');
        if (KeyPerms.length > 0) await embed.addField(
            'Key Permissions',
            `${context.guild.ownerId === targetUser.id ? emojis.owner + ' **`SERVER OWNER`**, ' : ''} \`${KeyPerms.join('`, `')}\``);

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
