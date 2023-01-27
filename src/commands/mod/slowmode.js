const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {oneLine, stripIndent} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class SlowmodeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'slowmode',
            aliases: ['slow', 'sm'],
            usage: 'slowmode [channel mention/ID] <rate> [reason]',
            description: oneLine`
        Enables slowmode in a channel with the specified rate.
        If no channel is provided, then slowmode will affect the current channel.
        Provide a rate of 0 to disable.
      `,
            type: client.types.MOD,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'ManageChannels'],
            userPermissions: ['ManageChannels'],
            examples: ['slowmode #general 2', 'slowmode 3'],
            slashCommand: new SlashCommandBuilder()
                .addIntegerOption(i => i.setName('rate').setDescription('The rate (0-59) to set slowmode at. 0 to disable').setRequired(true))
                .addChannelOption(c => c.setName('channel').setDescription('The channel to set slowmode in'))
                .addStringOption(t => t.setName('reason').setDescription('The reason for the slowmode'))
        });
    }

    run(message, args) {
        let channel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (channel) args.shift();
        else channel = message.channel;

        const rate = args[0];
        if (rate) args.shift();
        else return this.sendErrorMessage(message, 0, 'Please provide a rate limit between 0 and 59 seconds');

        const reason = args.join(' ');

        this.handle(channel, rate, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();

        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const rate = interaction.options.getInteger('rate');
        const reason = interaction.options.getString('reason');

        await this.handle(channel, rate, reason, interaction);
    }

    async handle(channel, rate, reason, context) {
        // Check type and viewable
        if (channel.type != ChannelType.GuildText || !channel.viewable)
            return this.sendErrorMessage(
                context,
                0,
                stripIndent`
      Please mention an accessible text channel or provide a valid text channel ID
    `
            );

        // Check rate
        if (isNaN(rate) || rate < 0 || rate > 59)
            return this.sendErrorMessage(
                context,
                0,
                stripIndent`
      Please provide a rate limit between 0 and 59 seconds
    `
            );

        // Check channel permissions
        if (!channel.permissionsFor(context.guild.members.me).has(['ManageChannels']))
            return this.sendErrorMessage(
                context,
                0,
                'I do not have permission to manage the provided channel'
            );

        // Check reason
        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        await channel.setRateLimitPerUser(rate, reason); // set channel rate
        const status = channel.rateLimitPerUser ? 'enabled' : 'disabled';
        const embed = new EmbedBuilder()
            .setTitle('Slowmode')
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Slowmode disabled
        if (rate === '0') {
            const payload = {
                embeds: [
                    embed
                        .setDescription(`\`${status}\` ➔ \`disabled\``)
                        .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
                        .addFields([{name: 'Channel', value: channel.toString(), inline: true}])
                        .addFields([{name: 'Reason', value: reason}]),
                ],
            };

            await this.sendReply(context, payload);

        }
        else { // Slowmode enabled
            const payload = {
                embeds: [
                    embed
                        .setDescription(`\`${status}\` ➔ \`enabled\``)
                        .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
                        .addFields([{name: 'Channel', value: channel.toString(), inline: true}])
                        .addFields([{name: 'Rate', value: `\`${rate}\``, inline: true}])
                        .addFields([{name: 'Reason', value: reason}]),
                ],
            };
            await this.sendReply(context, payload);
        }

        // Update mod log
        await this.sendModLogMessage(context, reason, {
            Channel: channel,
            Rate: `\`${rate}\``,
        });
    }
};
