const Command = require('../Command.js');
const {EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType} = require('discord.js');
const ButtonMenu = require('../ButtonMenu.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class activityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'activity',
            aliases: ['count', 'messages', 'messagecount'],
            usage: 'activity <user> <days>',
            description: 'Fetches number of messages sent by users or a role with an optional day filter. For example, `activity @split 7` will display the activity of the user named split over the last 7 days.',
            type: client.types.INFO,
            examples: ['activity 1', 'activity @CoolRole', 'activity @split 7'],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand(s => s.setName('user').setDescription('Fetches number of messages sent by a user.')
                    .addUserOption(u => u.setName('user').setDescription('The user to fetch activity for.')).addIntegerOption(i => i.setName('days').setDescription('The number of days to fetch activity for.')))
                .addSubcommand(s => s.setName('role').setDescription('Fetches number of messages sent by a role.')
                    .addRoleOption(r => r.setName('role').setDescription('The role to fetch activity for.')).addIntegerOption(i => i.setName('days').setDescription('The number of days to fetch activity for.')))
                .addSubcommand(s => s.setName('server').setDescription('Fetches number of messages sent by the server.').addIntegerOption(i => i.setName('days').setDescription('The number of days to fetch activity for.')))
        });
    }

    async run(message, args) {
        let target, days;
        if (args.length >= 2) {
            target = await this.getGuildMemberOrRole(message.guild, args[0]);
            days = parseInt(args[1]) || 1000;
        }
        else if (args.length === 1) {
            // if its a number, assume its days, otherwise assume its a user or role
            if (parseInt(args[0])) {
                days = parseInt(args[0]);
                target = null;
            }
            else {
                target = await this.getGuildMemberOrRole(message.guild, args[0]);
                days = 1000;
            }
        }

        this.handle(target, days, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const filter = interaction.options.getSubcommand();
        let target;
        if (filter === 'user') {
            target = interaction.options.getUser('user');
        }
        else if (filter === 'role') {
            target = interaction.options.getRole('role');
        }
        else if (filter === 'server') {
            target = null;
        }
        const days = interaction.options.getInteger('days') || 1000;
        this.handle(target, days, interaction, true);
    }

    handle(target, days, context) {
        const embed = new EmbedBuilder()
            .setDescription(`${emojis.load} Fetching Message Count...`);

        this.sendReply(context, {embeds: [embed]}).then(async (msg) => {
            const moderationButton = context.member.permissions.has('ViewAuditLog') && new ButtonBuilder()
                .setCustomId('moderations')
                .setLabel('Moderation Leaderboard')
                .setStyle(ButtonStyle.Secondary);
            const pointsButton = new ButtonBuilder()
                .setCustomId('points')
                .setLabel('Points Leaderboard')
                .setStyle(ButtonStyle.Secondary);
            pointsButton.setEmoji(emojis.point.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);

            const row = new ActionRowBuilder();
            row.addComponents(pointsButton);
            if (moderationButton) {
                moderationButton.setEmoji(emojis.mod.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);
                row.addComponents(moderationButton);
            }

            if (!target) await this.sendMultipleMessageCount(context, msg, embed, 'Server Activity', 1000, row);
            else if (target) {
                if (target.constructor.name === 'GuildMember' || target.constructor.name === 'User')
                    return this.sendUserMessageCount(context, target, embed, msg, days);
                else if (target.constructor.name === 'Role')
                    return this.sendMultipleMessageCount(context, msg, embed, `${target.name}'s ${days < 1000 && days > 0 ? days + ' Day ' : ''}Activity`, days, row, target);
                else {
                    msg.edit({embeds: [this.createErrorEmbed('Invalid user or role.')]});
                }
            }
        });
    }

    async sendMultipleMessageCount(message, msg, embed, title, days = 1000, row, role) {
        if (days > 1000 || days < 0) days = 1000;
        let data;
        if (role) {
            if (role.members.size > 1000) return msg.edit(`${emojis.fail} This role has too many members, please try again with a role that has less than 1000 members.`);

            data = this.selectById(role.members.map((m) => {
                return m.id;
            }), message, days);
        }
        else data = this.client.db.activities.getGuildMessages.all(message.guild.id, days);

        let max;
        if (!max || max < 0) max = 10; else if (max > 25) max = 25;

        const lb = data.flatMap((d) => {
            if (!d.user_id) return [];
            return {user: `<@${d.user_id}>`, count: d.messages || 0};
        });

        let i = 1;
        const descriptions = lb.map((e) => {
            const desc = `**${i}.** ${e.user}: **\`${e.count || 0}\`**`;
            i++;
            return desc;
        });

        if (descriptions.length <= max) {
            const range = descriptions.length === 1 ? '[1]' : `[1 - ${descriptions.length}]`;
            await msg.edit({
                embeds: [embed
                    .setTitle(`${title} ${range}`)
                    .setDescription(descriptions.join('\n')),],
            });
        }
        else {
            const position = lb.findIndex((p) => p.user.id === message.author.id);
            embed.setTitle(title).setFooter({
                text: 'Expires after two minutes.\n' + `${message.member.displayName}'s position: ${position + 1}`,
                iconURL: this.getAvatarURL(message.author),
            });
            msg.delete();
            new ButtonMenu(this.client, message.channel, message.member, embed, descriptions, max, null, 120000, [row], (m) => {
                const filter = (button) => button.user.id === message.author.id;
                const collector = m.createMessageComponentCollector({
                    filter, componentType: ComponentType.Button, time: 120000, dispose: true,
                });
                collector.on('collect', (b) => {
                    if (b.customId === 'moderations') {
                        this.client.commands
                            .get('modactivity')
                            .run(message, []);
                        m.delete();
                    }
                    else if (b.customId === 'points') {
                        this.client.commands
                            .get('leaderboard')
                            .run(message, []);
                        m.delete();
                    }
                });
            });
        }
    }

    selectById(ids, message, days) {
        const params = '?,'.repeat(ids.length).slice(0, -1);
        const stmt = this.client.db.db.prepare(`SELECT SUM(messages) as messages, user_id FROM activities WHERE guild_id = ${message.guild.id} AND activity_date > date('now', '-${days} day' ) AND user_id IN (${params}) GROUP BY user_id ORDER BY 1 DESC;`);
        return stmt.all(ids);
    }

    sendUserMessageCount(message, target, embed, msg, days) {
        if (days > 1000 || days < 0) days = 1000;
        const messages = this.client.db.activities.getMessages
            .pluck()
            .get(target.id, message.guild.id, days);
        embed.setTitle(`${this.getUserIdentifier(target)}'s ${days < 1000 && days > 0 ? days + ' Day ' : ''}Activity`);
        embed.setDescription(`${target} has sent **${messages || 0} messages** ${days === 1000 ? 'so far!' : 'in the last ' + days + ' days!'}`);
        msg.edit({embeds: [embed]});
    }
};
