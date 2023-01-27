const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const moment = require('moment');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WarnPurgeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'warnpurge',
            aliases: ['purgewarn'],
            usage: 'warnpurge <user mention/ID> <message count> [reason]',
            description:
                'Warns a member and then purges their messages in the current channel.',
            type: client.types.MOD,
            clientPermissions: [
                'SendMessages',
                'EmbedLinks',
                'KickMembers',
                'ManageMessages',
            ],
            userPermissions: ['KickMembers', 'ManageMessages'],
            examples: ['warnpurge @split 50'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to warn and purge messages from.'))
                .addIntegerOption(i => i.setName('amount').setRequired(true).setDescription('The amount of messages to purge'))
                .addStringOption(s => s.setName('reason').setRequired(false).setDescription('The reason for the warnpurge'))
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Warn Purge', this)]});
        const member =
            await this.getGuildMember(message.guild, args[0]);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );

        let amount = parseInt(args[1]);

        let reason = args.slice(2).join(' ');

        await this.handle(member, amount, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason');

        await this.handle(member, amount, reason, interaction);
    }

    async handle(member, amount, reason, context) {
        if (member === context.member)
            return this.sendErrorMessage(context, 0, 'You cannot warn yourself');

        const autoKick = this.client.db.settings.selectAutoKick
            .pluck()
            .get(context.guild.id); // Get warn # for auto kick

        if (amount > 100) amount = 100;
        if (isNaN(amount) === true || !amount || amount < 0)
            return this.sendErrorMessage(
                context,
                0,
                'Please provide a context count between 1 and 100'
            );


        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        // Warn
        let warns = this.client.db.users.selectWarns
            .pluck()
            .get(member.id, context.guild.id) || {warns: []};
        if (typeof warns == 'string') warns = JSON.parse(warns);
        const warning = {
            mod: context.member.id,
            date: moment().format('MMM DD YYYY'),
            reason: reason,
        };

        warns.warns.push(warning);

        this.client.db.users.updateWarns.run(
            JSON.stringify(warns),
            member.id,
            context.guild.id
        );

        // Purge
        const messages = (
            await context.channel.messages.fetch({limit: amount})
        ).filter((m) => m.member.id === member.id);
        if (messages.size > 0) await context.channel.bulkDelete(messages, true);

        const embed = new EmbedBuilder()
            .setTitle('Warnpurge Member')
            .setDescription(
                `${member} has been warned, with **${messages.size}** messages purged.`
            )
            .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
            .addFields([{name: 'Member', value: member.toString(), inline: true}])
            .addFields([{name: 'Warn Count', value: `\`${warns.warns.length}\``, inline: true}])
            .addFields([{name: 'Found Messages', value: `\`${messages.size}\``, inline: true}])
            .addFields([{name: 'Reason', value: reason}])
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        await this.sendReply(context, {embeds: [embed]});

        this.client.logger.info(
            `${context.guild.name}: ${context.author.tag} warnpurged ${member.user.tag}`
        );

        // Update mod log
        await this.sendModLogMessage(context, reason, {
            Member: member,
            'Warn Count': `\`${warns.warns.length}\``,
            'Found Messages': `\`${messages.size}\``,
        });

        // Check for auto kick
        if (autoKick && warns.warns.length === autoKick) {
            this.client.commands
                .get('kick')
                .run(context, [
                    member.id,
                    `Warn limit reached. Automatically kicked by ${context.guild.members.me}.`,
                ]);
        }
    }
};
