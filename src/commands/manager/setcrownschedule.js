const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const parser = require('cron-parser');
const {success} = require('../../utils/emojis.json');
const {stripIndent} = require('common-tags');

const allowNonZeroMinutes = true;

module.exports = class SetCrownScheduleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownschedule',
            aliases: ['setcs', 'scs', 'crownscedule'],
            usage: 'setcrownschedule <cron>',
            description: stripIndent`
        Sets the schedule for Calypso's crown role rotation. 
        The format is cron-style:
        \`\`\`*    *    *    *    *
        ┬    ┬    ┬    ┬    ┬
        │    │    │    │    │
        │    │    │    │    └ day of week (0 - 7)
        │    │    │    └───── month (1 - 12)
        │    │    └────────── day of month (1 - 31)
        │    └─────────────── hour (0 - 23)
        └──────────────────── minute (0 - 59)\`\`\`
        If you wish to use multiple values for any of the categories, please separate them with \`,\`.` +
                ' Step syntax is also supported, for example: `0 */1 * * *` (every hour). ' +
                'For the day of the week, both 0 and 7 may represent Sunday. ' +
                'If you need additional help building your cron, please check out this website: <https://crontab.guru/#>. ' +
                `Enter no schedule to display the current \`crown schedule\`.
                 Enter \`reset\` to reset the current schedule.
        A \`crown role\` must also be set to enable role rotation.
        **Please Note:** To prevent potential Discord API abuse, minutes and seconds will always be set to \`0\`.`,
            type: client.types.MANAGER,
            examples: ['setcrownschedule 0 21 * * 3,6', 'setcrownschedule reset', 'setcrownschedule'],
        });
    }

    run(message, args) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: oldCrownSchedule
        } = message.client.db.settings.selectCrown.get(message.guild.id);
        const crownRole = message.guild.roles.cache.get(crownRoleId);
        const crownChannel = message.guild.channels.cache.get(crownChannelId);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        let description = `The \`crown schedule\` was successfully updated. ${success}`;
        const embed = new MessageEmbed()
            .setTitle('Settings: `Crown`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(description)
            .addField('Role', `${crownRole}` || '`None`', true)
            .addField('Channel', `${crownChannel}` || '`None`', true)
            .addField('Message', message.client.utils.replaceCrownKeywords(crownMessage) || '`None`')
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Display current schedule
        if (!args.length) {
            const crown = message.client.db.settings.selectCrown.get(message.guild.id);
            if (!crown.crown_schedule) {
                embed.setDescription('The `crown schedule` is currently `disabled`.');
                return message.channel.send({
                    embeds: embed
                });
            }

            embed.setDescription(`The \`crown schedule\` is currently set to: \`${crown.crown_schedule}\``);
            return message.channel.send({
                embeds: [embed]
            });
        }
        // Clear schedule
        else if (args[0] === 'reset') {
            message.client.db.settings.updateCrownSchedule.run('0 */24 * * *', message.guild.id);

            if (message.guild.job) message.guild.job.cancel(); // Cancel old job
            message.client.logger.info(`${message.guild.name}: Cancelled job`);

            // Schedule crown role rotation
            message.client.utils.scheduleCrown(message.client, message.guild);
            message.client.logger.info(`${message.guild.name}: Scheduled job`);

            return message.channel.send({
                embeds: [embed
                    .spliceFields(2, 0, {
                        name: 'Schedule',
                        value: '`0 */24 * * *`',
                        inline: true
                    })]
            }
            );
        }

        let crownSchedule = message.content.slice(message.content.indexOf(args[0]), message.content.length);
        try {
            parser.parseExpression(crownSchedule);
        }
        catch (err) {
            return this.sendErrorMessage(message, 0, 'Please try again with a valid cron expression');
        }

        // Set minutes and seconds to 0
        const cron = crownSchedule.split(' ');
        if (!allowNonZeroMinutes && cron[0] !== '0') {
            description = description + `\n**Note:** Minutes were changed from \`${cron[0]}\` to \`0\`.`;
            cron[0] = '0';
        }
        if (cron.length === 6 && cron[5] !== '0') {
            if (description.includes('\n'))
                description = description.slice(0, -1) + `, and seconds were changed from \`${cron[5]}\` to \`0\`.`;
            else description = description + `\n**Note:** Seconds were changed from \`${cron[5]}\` to \`0\`.`;
            cron[5] = '0';
        }
        crownSchedule = cron.join(' ');
        embed.setDescription(description);

        message.client.db.settings.updateCrownSchedule.run(crownSchedule, message.guild.id);
        if (message.guild.job) message.guild.job.cancel(); // Cancel old job

        // Schedule crown role rotation
        message.client.utils.scheduleCrown(message.client, message.guild);

        message.channel.send({
            embeds: [embed
                .spliceFields(2, 0, {
                    name: 'Schedule',
                    value: `\`${oldCrownSchedule || 'None'}\` ➔ \`${crownSchedule}\``,
                    inline: true
                })]
        }
        );
    }
};
