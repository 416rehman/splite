const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine, stripIndent} = require('common-tags');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class PurgeBotCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'purgebot',
            aliases: ['clearbot', 'pb'],
            usage: 'purgebot [channel mention/ID] <message count> [reason]',
            description: oneLine`
        Sifts through the specified amount of messages in the provided channel
        and deletes all commands and messages from bots.
        If no channel is given, the messages will be deleted from the current channel.
        If no amount is specified, upto 100 messages will be deleted.
        No more than 100 messages may be sifted through at a time.
        Messages older than 2 weeks old cannot be deleted.
      `,
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES'],
            userPermissions: ['MANAGE_MESSAGES'],
            examples: ['purgebot 20'],
            slashCommand: new SlashCommandBuilder().setName('cleanup').setDescription('purgebot - clears bot spam messages in a channel')
                .addChannelOption(c => c.setName('channel').setDescription('The channel to purge messages from'))
                .addIntegerOption(c => c.setName('amount').setDescription('The amount of messages to purge'))
                .addStringOption(c => c.setName('reason').setDescription('The reason for the purge'))
        });
    }

    run(message, args) {
        let channel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (channel) args.shift();
        else channel = message.channel;

        let amount = parseInt(args[0]);

        let reason = args.slice(1).join(' ');

        this.handle(channel, amount, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason');

        this.handle(channel, amount, reason, interaction);
    }

    async handle(channel, amount, reason, context) {
        // Check type and viewable
        if (channel.type !== 'GUILD_TEXT' || !channel.viewable)
            return this.sendErrorMessage(
                context,
                0,
                stripIndent`Please mention an accessible text channel or provide a valid text channel ID`
            );


        if (isNaN(amount) === true || !amount || amount < 0 || amount > 100)
            amount = 100;

        // Check channel permissions
        if (!channel.permissionsFor(context.guild.me).has(['MANAGE_MESSAGES']))
            return this.sendErrorMessage(
                context,
                0,
                'I do not have permission to manage messages in the provided channel'
            );

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id); // Get prefix

        // Find messages
        let messages = (await context.channel.messages.fetch({limit: amount})).filter((msg) => {
            if (msg.id === context.id) return false; // Don't delete the command message
            // Filter for commands or bot messages
            return this.client.utils.isCommandOrBotMessage(msg, prefix);
        });

        if (messages.size === 0) {
            // No messages found
            const payload = {
                embeds: [
                    new MessageEmbed()
                        .setTitle('Purgebot')
                        .setDescription(`Unable to find any bot messages or commands. 
                            This context will be deleted after \`10 seconds\`.`)
                        .addField('Channel', channel.toString(), true)
                        .addField('Found Messages', `\`${messages.size}\``, true)
                        .setFooter({
                            text: context.member.displayName,
                            iconURL: this.getAvatarURL(context.author),
                        })
                        .setTimestamp()
                        .setColor(context.guild.me.displayHexColor),
                ],
            };
            this.sendReplyAndDelete(context, payload);
        }
        else {
            // Purge messages
            channel.bulkDelete(messages, true).then((msgs) => {
                const embed = new MessageEmbed()
                    .setTitle('Purgebot')
                    .setDescription(`Successfully deleted **${msgs.size}** context(s). 
                    This context will be deleted after \`10 seconds\`.`)
                    .addField('Channel', channel.toString(), true)
                    .addField('Found Messages', `\`${msgs.size}\``, true)
                    .addField('Reason', reason)
                    .setFooter({
                        text: context.member.displayName,
                        iconURL: this.getAvatarURL(context.author),
                    })
                    .setTimestamp()
                    .setColor(context.guild.me.displayHexColor);

                this.sendReplyAndDelete(context, {embeds: [embed]});
            });
        }

        // Update mod log
        this.sendModLogMessage(context, reason, {
            Channel: channel,
            'Found Messages': `\`${messages.size}\``,
        });
    }
};
