const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const emojis = require('../../utils/emojis.json');

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
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args[0])) || message.member;
        const userFlags = (await member.user.fetchFlags()).toArray();
        if (this.client.getOwnerFromId(member.user.id)) userFlags.push('BOT_OWNER');
        if (this.client.getManagerFromId(member.user.id)) userFlags.push('BOT_MANAGER');
        const activities = [];
        let customStatus;
        if (member.presence?.activities) {
            for (const activity of member.presence.activities.values()) {
                switch (activity.type) {
                case 'PLAYING':
                    activities.push(`Playing **${activity.name}**`);
                    break;
                case 'LISTENING':
                    if (member.user.bot) activities.push(`Listening to **${activity.name}**`); else activities.push(`Listening to **${activity.details}** by **${activity.state}**`);
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
        const KeyPerms = member.permissions
            .toArray()
            .filter((p) => elevatedPerms.includes(p));
        if (KeyPerms.includes('ADMINISTRATOR')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'ADMINISTRATOR'), 0);
        if (KeyPerms.includes('MANAGE_GUILD') && KeyPerms.includes('ADMINISTRATOR')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'MANAGE_GUILD'), 1); else if (KeyPerms.includes('MANAGE_GUILD')) KeyPerms.move(KeyPerms.findIndex((p) => p === 'MANAGE_GUILD'), 0);
        // Trim roles
        let roles = message.client.utils.trimArray([...member.roles.cache.values()].filter((r) => !r.name.startsWith('#')));
        roles = message.client.utils
            .removeElement(roles, message.guild.roles.everyone)
            .sort((a, b) => b.position - a.position)
            .join(' ');
        const embed = new MessageEmbed()
            .setTitle(`${member.displayName}'s Information`)
            .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
            .addField('User', member.toString(), true)
            .addField('Discriminator', `\`#${member.user.discriminator}\``, true)
            .addField('ID', `\`${member.id}\``, true)
            .addField('Bot', `\`${member.user.bot}\``, true)
            .addField('Voted on Top.gg', (await message.client.utils.checkTopGGVote(
                this.client,
                member.id
            )) ? 'Yes' : 'No', true)
            .addField('Highest Role', member.roles.highest.toString(), true)
            .addField('Joined server on', `\`${moment(member.joinedAt).format('MMM DD YYYY')}\``, true)
            .addField('Joined Discord on', `\`${moment(member.user.createdAt).format('MMM DD YYYY')}\``, true)
            .setFooter({
                text: message.member.displayName, iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);

        if (this.client.enabledIntents.find(i => i === this.client.intents.GUILD_PRESENCES)) await embed.addField('Status', statuses[member.presence?.status || 'offline'], true);
        if (activities.length > 0) embed.setDescription(activities.join('\n'));
        if (customStatus) await embed.spliceFields(0, 0, {
            name: 'Custom Status', value: customStatus,
        });
        if (userFlags.length > 0) await embed.addField('Badges', userFlags.map((flag) => flags[flag]).join('\n'), true);
        await embed.addField('Roles', roles || '`None`');
        if (KeyPerms.length > 0) await embed.addField(
            'Key Permissions',
            `${message.guild.ownerId === member.id ? emojis.owner + ' **`SERVER OWNER`**, ' : ''} \`${KeyPerms.join('`, `')}\``);
        message.channel.send({embeds: [embed]});
    }
};
