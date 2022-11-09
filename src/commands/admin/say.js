const Command = require('../Command.js');
const {oneLine} = require('common-tags');
const {ChannelType} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'say',
            usage: 'say [channel mention/ID] <message>',
            description: oneLine`
        Sends a message to the specified channel. 
        If no channel is given, then the message will be sent to the current channel.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['say #general hello world'],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(m => m.setRequired(true).setName('message').setDescription('The message to send'))
                .addChannelOption(c => c.setRequired(false).setName('channel').setDescription('The channel to send the message to'))
        });
    }

    run(message, args) {
        let channel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (channel) args.shift();

        if (!channel) {
            channel = message.channel;
        }

        if (!args[0])
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a message for me to say'
            );

        this.handle(args.join(' '), channel, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const text = interaction.options.getString('message');
        this.handle(text, channel, interaction, true);
    }

    handle(text, channel, context) {
        // Check type and viewable
        if (channel.type !== ChannelType.GuildText || !channel.viewable) {
            const payload = fail + ' The provided channel is not a text channel or is not viewable.';

            this.sendReply(context, payload);
            return;
        }

        // Get mod channels
        let modChannelIds = this.client.db.settings.selectModChannelIds.pluck().get(context.guild.id) || [];

        if (typeof modChannelIds === 'string') modChannelIds = modChannelIds.split(' ');

        if (modChannelIds.includes(channel.id)) {
            const payload = fail + ' Provided channel is moderator only, please mention an accessible text channel or provide a valid text channel ID.';

            this.sendReply(context, payload);
            return;
        }

        // Check channel permissions
        if (!channel.permissionsFor(context.guild.members.me).has(['SEND_MESSAGES'])) {
            const payload = fail + ' I do not have permission to send messages in this channel.';

            this.sendReply(context, payload);
            return;
        }


        if (!channel.permissionsFor(context.member).has(['SEND_MESSAGES'])) {
            const payload = fail + ' You do not have permission to send messages in this channel.';

            this.sendReply(context, payload);
            return;
        }

        // const msg = context.content.slice(context.content.indexOf(args[0]), context.content.length);
        channel.send(text);

        this.sendReply(context, 'Message sent!');
    }
};
