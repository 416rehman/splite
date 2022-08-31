const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine, stripIndent} = require('common-tags');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class PurgeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'purge',
            usage: 'purge [channel mention/ID] [user mention/ID] <message count> [reason]',
            description: oneLine`
        Deletes the specified amount of messages from the provided channel. 
        If no channel is given, the messages will be deleted from the current channel.
        If a member is provided, only their messages will be deleted from the batch.
        No more than 100 messages may be deleted at a time.
        Messages older than 2 weeks old cannot be deleted.
      `,
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES'],
            userPermissions: ['MANAGE_MESSAGES'],
            examples: [
                'purge 20',
                'purge #general 10',
                'purge @split 50',
                'purge #general @split 5',
            ],
            slashCommand: new SlashCommandBuilder().setName('purge').setDescription('Delete specific amount of messages by a user or in a channel.')
                .addIntegerOption(i => i.setName('amount').setDescription('The amount of messages to purge.').setRequired(true))
                .addUserOption(u => u.setName('user').setDescription('The user to purge messages from.').setRequired(false))
                .addChannelOption(c => c.setName('channel').setDescription('The channel to purge messages from.').setRequired(false))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the purge.').setRequired(false))
        });
    }

    async run(message, args) {
        let channel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (channel) args.shift();
        else channel = message.channel;

        let member = await this.getGuildMember(message.guild, args[0]);
        if (member) args.shift();

        let amount = parseInt(args[0]);

        let reason = args.slice(1).join(' ');

        this.handle(member, channel, amount, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason');

        this.handle(member, channel, amount, reason, interaction);
    }

    async handle(member, channel, amount, reason, context) {
        // Check type and viewable
        if (channel.type !== 'GUILD_TEXT' || !channel.viewable)
            return this.sendErrorMessage(
                context,
                0,
                stripIndent`
      Please mention an accessible text channel or provide a valid text channel ID
    `
            );

        if (amount > 100) amount = 100;
        if (isNaN(amount) === true || !amount || amount < 0)
            return this.sendErrorMessage(
                context,
                0,
                'Please provide a context count between 1 and 100'
            );

        // Check channel permissions
        if (!channel.permissionsFor(context.guild.me).has(['MANAGE_MESSAGES']))
            return this.sendErrorMessage(
                context,
                0,
                'I do not have permission to manage messages in the provided channel'
            );

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        // Find member contexts if given
        let messages;
        if (member) {
            messages = (await channel.contexts.fetch({limit: amount})).filter(
                (m) => m.member.id === member.id
            );
        }
        else messages = amount;

        if (messages.size === 0) {
            // No contexts found

            context.channel
                .send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Purge')
                            .setDescription(
                                `
            Unable to find any contexts from ${member}. 
            This message will be deleted after \`10 seconds\`.
          `
                            )
                            .addField('Channel', channel.toString(), true)
                            .addField('Member', member.toString())
                            .addField('Found Messages', `\`${messages.size}\``, true)
                            .setFooter({
                                text: context.member.displayName,
                                iconURL: this.getAvatarURL(context.author),
                            })
                            .setTimestamp()
                            .setColor(context.guild.me.displayHexColor),
                    ],
                })
                .then((msg) => {
                    setTimeout(() => msg.delete(), 10000);
                })
                .catch((err) => this.client.logger.error(err.stack));
        }
        else {
            // Purge contexts

            channel.bulkDelete(messages, true).then((contexts) => {
                const embed = new MessageEmbed()
                    .setTitle('Purge')
                    .setDescription(
                        `
            Successfully deleted **${contexts.size}** context(s). 
            This context will be deleted after \`10 seconds\`.
          `
                    )
                    .addField('Channel', channel.toString(), true)
                    .addField('Message Count', `\`${contexts.size}\``, true)
                    .addField('Reason', reason)
                    .setFooter({
                        text: context.member.displayName,
                        iconURL: this.getAvatarURL(context.author),
                    })
                    .setTimestamp()
                    .setColor(context.guild.me.displayHexColor);

                if (member) {
                    embed
                        .spliceFields(1, 1, {
                            name: 'Found Messages',
                            value: `\`${contexts.size}\``,
                            inline: true,
                        })
                        .spliceFields(1, 0, {
                            name: 'Member',
                            value: member.toString(),
                            inline: true,
                        });
                }

                context.channel
                    .send({embeds: [embed]})
                    .then((msg) => {
                        setTimeout(() => msg.delete(), 5000);
                    })
                    .catch((err) => this.client.logger.error(err.stack));
            });
        }

        // Update mod log
        const fields = {
            Channel: channel,
        };

        if (member) {
            fields['Member'] = member.toString();
            fields['Found Messages'] = `\`${messages.size}\``;
        }
        else fields['Message Count'] = `\`${amount}\``;

        this.sendModLogMessage(context, reason, fields);
    }
};
