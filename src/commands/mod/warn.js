const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const moment = require('moment');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WarnCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'warn',
            usage: 'warn <user mention/ID> [reason]',
            description: 'Warns a member in your server. Member will be automatically kicked if they reach the autokick limit.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS'],
            userPermissions: ['KICK_MEMBERS'],
            examples: ['warn @split'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to warn'))
                .addStringOption(t => t.setName('reason').setRequired(false).setDescription('The reason for the warning'))
        });
    }


    async run(message, args) {
        if (!args[0]) {
            return message.reply({embeds: [this.createHelpEmbed(message, this)]});
        }
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        }

        let reason = args.slice(1).join(' ');

        await this.handle(member, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        await this.handle(member, reason, interaction);
    }

    async handle(member, reason, context) {
        if (member === context.member)
            return this.sendErrorMessage(context, 0, 'You cannot warn yourself');
        if (
            member.roles.highest.position >= context.member.roles.highest.position
        )
            return this.sendErrorMessage(
                context,
                0,
                'You cannot warn someone with an equal or higher role'
            );

        // Get warn # for auto kick
        const autoKick = this.client.db.settings.selectAutoKick.pluck().get(context.guild.id);

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

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

        const embed = new EmbedBuilder()
            .setTitle('Warn Member')
            .setDescription(`${member} has been warned.`)
            .addFields([{name: 'Moderator', value:  context.member.toString(), inline:  true}])
            .addFields([{name: 'Member', value:  member.toString(), inline:  true}])
            .addFields([{name: 'Warn Count', value:  `\`${warns.warns.length}\``, inline:  true}])
            .addFields([{name: 'Reason', value:  reason}])
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        await this.sendReply(context, {embeds: [embed]});

        this.client.logger.info(
            `${context.guild.name}: ${context.author.tag} warned ${member.user.tag}`
        );

        // Update mod log
        await this.sendModLogMessage(context, reason, {
            Member: member,
            'Warn Count': `\`${warns.warns.length}\``,
        });

        // Check for auto kick
        if (autoKick && warns.warns.length >= autoKick) {
            try {
                const reason = `Warn limit reached. Automatically kicked by ${context.guild.members.me}.`;
                await member.kick(reason);
                await this.sendModLogMessage(context, reason, {Member: member});
            }
            catch (e) {
                this.sendErrorMessage(context, 0, e.context);
            }
        }
    }
};
