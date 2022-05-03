const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const ButtonMenu = require('../ButtonMenu.js');
const emojis = require('../../utils/emojis.json');
const {MessageActionRow} = require('discord.js');
const {MessageButton} = require('discord.js');

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
            userPermissions: ['VIEW_AUDIT_LOG'],
        });
    }

    run(message, args) {
        const embed = new MessageEmbed()
            .setDescription(`${emojis.load} Fetching Mod Activity...`)
            .setColor('RANDOM');

        message.channel.send({embeds: [embed]}).then(async (msg) => {
            const activityButton = new MessageButton()
                .setCustomId('activity')
                .setLabel('Activity Leaderboard')
                .setStyle('SECONDARY');
            activityButton.setEmoji(
                emojis.info.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]
            );
            const pointsButton = new MessageButton()
                .setCustomId('points')
                .setLabel('Points Leaderboard')
                .setStyle('SECONDARY');
            pointsButton.setEmoji(
                emojis.point.match(/(?<=:)(.*?)(?=>)/)[1].split(':')[1]
            );

            const row = new MessageActionRow();
            row.addComponents(activityButton);
            row.addComponents(pointsButton);

            if (!args[0])
                await this.sendMultipleMessageCount(
                    args,
                    message,
                    msg,
                    embed,
                    'Server Mod Activity',
                    1000,
                    row
                );
            else {
                const target = await this.getGuildMemberOrRole(message.guild, args[0]);
                let days = parseInt(args[1]) || 1000;

                if (target) {
                    if (
                        target.constructor.name === 'GuildMember' ||
                        target.constructor.name === 'User'
                    )
                        return this.sendUserMessageCount(
                            message,
                            target,
                            embed,
                            msg,
                            days
                        );
                    else if (target.constructor.name === 'Role')
                        return this.sendMultipleMessageCount(
                            args,
                            message,
                            msg,
                            embed,
                            `${target.name}'s ${
                                days < 1000 && days > 0 ? days + ' Day ' : ''
                            }Mod Activity`,
                            days,
                            row,
                            target
                        );
                }
                else if (!args[1]) {
                    days = parseInt(args[0]) || 1000;
                    await this.sendMultipleMessageCount(
                        args,
                        message,
                        msg,
                        embed,
                        `Server ${
                            days < 1000 && days > 0 ? days + ' Day ' : ''
                        }Mod Activity`,
                        days,
                        row
                    );
                }
                else {
                    msg.edit({embeds: [this.errorEmbed('Invalid user or role.')]});
                }
            }
        });
    }

    async sendMultipleMessageCount(
        args,
        message,
        msg,
        embed,
        title,
        days = 1000,
        row,
        role
    ) {
        if (days > 1000 || days < 0) days = 1000;

        let moderators;
        if (role) {
            if (role.members.size > 1000)
                return msg.edit(
                    `${emojis.fail} This role has too many members, please try again with a role that has less than 1000 members.`
                );

            moderators = this.selectById(role.members.map((m) => {
                return m.id;
            }), message, days);
        }
        else {
            moderators = message.client.db.activities.getGuildModerations.all(
                message.guild.id,
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
            const range =
                descriptions.length == 1 ? '[1]' : `[1 - ${descriptions.length}]`;
            await msg.edit({
                embeds: [
                    embed
                        .setTitle(`${title} ${range}`)
                        .setDescription(descriptions.join('\n')),
                ],
            });
        }
        else {
            const position = lb.findIndex((p) => p.user.id === message.author.id);
            embed.setTitle(title).setFooter({
                text:
                    'Expires after two minutes.\n' +
                    `${message.member.displayName}'s position: ${position + 1}`,
                iconURL: message.author.displayAvatarURL(),
            });
            msg.delete();
            new ButtonMenu(
                message.client,
                message.channel,
                message.member,
                embed,
                descriptions,
                max,
                null,
                120000,
                [row],
                (m) => {
                    const filter = (button) => button.user.id === message.author.id;
                    const collector = m.createMessageComponentCollector({
                        filter,
                        componentType: 'BUTTON',
                        time: 120000,
                        dispose: true,
                    });
                    collector.on('collect', (b) => {
                        if (b.customId === 'activity') {
                            message.client.commands.get('activity').run(message, []);
                            m.delete();
                        }
                        else if (b.customId === 'points') {
                            message.client.commands
                                .get('leaderboard')
                                .run(message, []);
                            m.delete();
                        }
                    });
                }
            );
        }
    }

    selectById(ids, message, days) {
        const params = '?,'.repeat(ids.length).slice(0, -1);
        const stmt = message.client.db.db.prepare(
            `SELECT SUM(moderations) as moderations, user_id FROM activities WHERE guild_id = ${message.guild.id} AND activity_date > date('now', '-${days} day' ) AND user_id IN (${params}) GROUP BY user_id ORDER BY 1 DESC;`
        );
        return stmt.all(ids);
    }

    sendUserMessageCount(message, target, embed, msg, days = 1000) {
        if (days > 1000 || days < 0) days = 1000;
        const messages = message.client.db.activities.getModerations
            .pluck()
            .get(target.id, message.guild.id, days || 1000);

        embed.setTitle(
            `${target.displayName}'s ${
                days < 1000 && days > 0 ? days + ' Day ' : ''
            }Activity`
        );
        embed.setDescription(
            `${target} has performed **${messages || 0} moderations** ${
                days === 1000 ? 'so far!' : 'in the last ' + days + ' days!'
            }`
        );

        msg.edit({embeds: [embed]});
    }
};
