const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const parser = require('cron-parser');
const {success} = require('../../utils/emojis.json');
const {stripIndent} = require('common-tags');

const allowNonZeroMinutes = true;

module.exports = class SetCrownScheduleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownschedule',
            aliases: ['setcs', 'scs', 'crownscedule'],
            usage: 'setcrownschedule <guildid> <cron>',
            description: stripIndent`
        Sets the schedule for the crown role rotation. 
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
        const guildId = args.shift();
        const cron = args.join(' ');

        this.handle(guildId, cron, args[1] === 'reset', message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const guildId = interaction.options.getString('guildid');
        const cron = interaction.options.getString('cron');
        const bReset = interaction.options.getString('reset');

        this.handle(guildId, cron, bReset, interaction);
    }

    handle(guildId, cron, bReset, context) {
        if (!guildId) {
            return this.sendErrorMessage(context, 0, 'Please provide a valid server ID');
        }

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
            return this.sendErrorMessage(context, 0, 'Unable to find server, please check the provided ID');
        }

        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: oldCrownSchedule
        } = this.client.db.settings.selectCrown.get(guild.id);
        const crownRole = guild.roles.cache.get(crownRoleId);
        const crownChannel = guild.channels.cache.get(crownChannelId);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        let description = `The \`crown schedule\` was successfully updated. ${success}`;
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Crown`')
            .setThumbnail(guild.iconURL({dynamic: true}))
            .setDescription(description)
            .addFields([{name: 'Role', value:  `${crownRole}` || '`None`', inline:  true}])
            .addFields([{name: 'Channel', value:  `${crownChannel}` || '`None`', inline:  true}])
            .addFields([{name: 'Message', value:  this.client.utils.replaceCrownKeywords(crownMessage) || '`None`'}])
            .setTimestamp();

        // Display current schedule
        if (!cron) {
            const crown = this.client.db.settings.selectCrown.get(guild.id);
            if (!crown.crown_schedule) {
                embed.setDescription('The `crown schedule` is currently `disabled`.');
                return this.sendReply(context, {
                    embeds: embed
                });
            }

            embed.setDescription(`The \`crown schedule\` is currently set to: \`${crown.crown_schedule}\``);
            return this.sendReply(context, {
                embeds: [embed]
            });
        }
        // Clear schedule
        else if (bReset) {
            this.client.db.settings.updateCrownSchedule.run('0 */24 * * *', guild.id);

            if (guild.job) guild.job.cancel(); // Cancel old job
            this.client.logger.info(`${guild.name}: Cancelled job`);

            // Schedule crown role rotation
            this.client.utils.scheduleCrown(this.client, guild);
            this.client.logger.info(`${guild.name}: Scheduled job`);

            return this.sendReply(context, {
                embeds: [embed
                    .spliceFields(2, 0, {
                        name: 'Schedule',
                        value: '`0 */24 * * *`',
                        inline: true
                    })]
            });
        }

        try {
            parser.parseExpression(cron);
        }
        catch (err) {
            return this.sendErrorMessage(context, 0, 'Please try again with a valid cron expression');
        }

        // Set minutes and seconds to 0
        const cronElements = cron.split(' ');
        if (!allowNonZeroMinutes && cronElements[0] !== '0') {
            description = description + `\n**Note:** Minutes were changed from \`${cronElements[0]}\` to \`0\`.`;
            cronElements[0] = '0';
        }
        if (cronElements.length === 6 && cronElements[5] !== '0') {
            if (description.includes('\n'))
                description = description.slice(0, -1) + `, and seconds were changed from \`${cronElements[5]}\` to \`0\`.`;
            else description = description + `\n**Note:** Seconds were changed from \`${cronElements[5]}\` to \`0\`.`;
            cronElements[5] = '0';
        }
        cron = cronElements.join(' ');
        embed.setDescription(description);

        this.client.db.settings.updateCrownSchedule.run(cron, guild.id);
        if (guild.job) guild.job.cancel(); // Cancel old job

        // Schedule crown role rotation
        this.client.utils.scheduleCrown(this.client, guild);

        this.sendReply(context, {
            embeds: [embed
                .spliceFields(2, 0, {
                    name: 'Schedule',
                    value: `\`${oldCrownSchedule || 'None'}\` ➔ \`${cron}\``,
                    inline: true
                })]
        });
    }
};
