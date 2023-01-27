const Command = require('../Command.js');
const {EmbedBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ButtonBuilder} = require('discord.js');
const ButtonMenu = require('../ButtonMenu.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class modActivityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'modactivity',
            aliases: ['moderations'],
            usage: 'modactivity <user>/<role> <days>',
            description:
                'Counts the number of moderation actions performed by a specified user or a role, and with an optional day filter. For example, `modactivity @split 7` will display the mod activity of the user named split over the last 7 days.',
            type: client.types.INFO,
            examples: [
                'modactivity 1',
                'modactivity @CoolRole',
                'modactivity @split 7',
            ],
            userPermissions: ['ViewAuditLog'],
            slashCommand: new SlashCommandBuilder()
                .addIntegerOption(d => d.setName('days').setDescription('The number of days to filter by.'))
                .addRoleOption(r => r.setName('role').setDescription('The role to get the mod activity of.'))
                .addUserOption(u => u.setName('user').setDescription('The user to get the mod activity of.'))
        });
    }

    async run(message, args) {
        const target = args[0] ? await this.getGuildMemberOrRole(message.guild, args[0]) : null;
        let days = args[1] ? parseInt(args[1]) : 1000;
        await this.handle(target, days, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        const user = interaction.options.getMember('user');
        const days = interaction.options.getInteger('days') || 1000;

        await this.handle(role || user, days, interaction);
    }

    async handle(target, days, context) {
        const activityButton = new ButtonBuilder()
            .setCustomId('activity')
            .setLabel('Activity Leaderboard')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emojis.info.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);

        const pointsButton = new ButtonBuilder()
            .setCustomId('points')
            .setLabel('Points Leaderboard')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emojis.point.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]);

        const row = new ActionRowBuilder()
            .addComponents(activityButton)
            .addComponents(pointsButton);

        if (!target) {
            await this.sendMultipleMessageCount(
                context,
                `Server ${
                    days < 1000 && days > 0 ? days + ' Day ' : ''
                }Mod Activity`,
                days,
                row
            );
        }
        else if (target) {
            //User
            if (target.constructor.name === 'GuildMember' || target.constructor.name === 'User')
                return this.sendUserMessageCount(context, target, days);
            //Role
            else if (target.constructor.name === 'Role')
                return this.sendMultipleMessageCount(context, `${target.name}'s ${days < 1000 && days > 0 ? days + ' Day ' : ''}Mod Activity`, days, row, target);
        }
        else {
            return this.sendErrorMessage(context, 0, '', 'Invalid user or role.');
        }

    }

    async sendMultipleMessageCount(context, title, days = 1000, row, role) {
        const embed = new EmbedBuilder();
        if (days > 1000 || days < 0) days = 1000;

        let moderators;
        if (role) { //Role
            if (role.members.size > 1000)
                return this.sendErrorMessage(context, 0, '', `${emojis.fail} This role has too many members, please try again with a role that has less than 1000 members.`);

            moderators = this.selectById(role.members.map((m) => {
                return m.id;
            }), context, days);
        }
        else { // Entire server
            moderators = this.client.db.activities.getGuildModerations.all(
                context.guild.id,
                days
            );
        }

        let max;
        if (!max || max < 0) max = 10;
        else if (max > 25) max = 25;

        let lb = moderators.flatMap((d) => {
            if (!d.user_id) return [];
            return {user: `<@${d.user_id}>`, count: d.moderations || 0};
        });

        const descriptions = lb.map((e, idx) => {
            return `**${idx + 1}.** ${e.user}: **\`${e.count || 0}\`**`;
        });

        if (descriptions.length <= max) {
            const range = descriptions.length == 1 ? '[1]' : `[1 - ${descriptions.length}]`;
            await this.sendReply(context, {
                embeds: [
                    embed
                        .setTitle(`${title} ${range}`)
                        .setDescription(descriptions.join('\n')),
                ],
            });
        }
        else {
            const position = lb.findIndex((p) => p.user.id === context.author.id);
            embed
                .setTitle(title)
                .setFooter({
                    text: 'Expires after two minutes.\n' + `${context.member.displayName}'s position: ${position + 1}`,
                    iconURL: this.getAvatarURL(context.author),
                });

            new ButtonMenu(
                this.client,
                context.channel,
                context.member,
                embed,
                descriptions,
                max,
                null,
                120000,
                [row],
                (m) => {
                    const filter = (button) => button.user.id === context.author.id;
                    const collector = m.createMessageComponentCollector({
                        filter,
                        componentType: ComponentType.Button,
                        time: 120000,
                        dispose: true,
                    });
                    collector.on('collect', (b) => {
                        if (b.customId === 'activity') {
                            this.client.commands.get('activity').run(context, []);
                            m.delete();
                        }
                        else if (b.customId === 'points') {
                            this.client.commands
                                .get('leaderboard')
                                .run(context, []);
                            m.delete();
                        }
                    });
                }
            );
        }
    }

    selectById(ids, context, days) {
        const params = ids.map(() => '?').join(',');
        const stmt = this.client.db.db.prepare(
            `SELECT SUM(moderations) as moderations, user_id FROM activities WHERE guild_id = ${context.guild.id} AND activity_date > date('now', '-${days} day' ) AND user_id IN (${params}) GROUP BY user_id ORDER BY 1 DESC;`
        );
        return stmt.all(...ids);
    }

    sendUserMessageCount(context, target, days = 1000) {
        if (days > 1000 || days < 0) days = 1000;
        const messages = this.client.db.activities.getModerations
            .pluck()
            .get(target.id, context.guild.id, days || 1000);
        const embed = new EmbedBuilder()
            .setTitle(`${target.displayName}'s ${days < 1000 && days > 0 ? days + ' Day ' : ''}Activity`)
            .setDescription(`${target} has performed **${messages || 0} moderations** ${days === 1000 ? 'so far!' : 'in the last ' + days + ' days!'}`);

        this.sendReply(context, {embeds: [embed]});
    }
};
