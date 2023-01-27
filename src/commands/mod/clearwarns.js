const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class ClearWarnsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearwarns',
            usage: 'clearwarns <user mention/ID> [reason]',
            description: 'Clears all the warns of the provided member.',
            type: client.types.MOD,
            userPermissions: ['KickMembers'],
            examples: ['clearwarns @split'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setRequired(true).setName('user').setDescription('The user to clear the warns of.'))
                .addStringOption(s => s.setRequired(false).setName('reason').setDescription('The reason for clearing the warns.'))
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args.join(' '));

        if (!member.id)
            return message.reply(
                'Please provide a valid member to clear their afk status.'
            );

        let reason = args.slice(1).join(' ');

        this.handle(member, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        this.handle(user, reason, interaction);
    }

    handle(member, reason, context) {
        if (member === context.member)
            return this.sendErrorMessage(
                context,
                0,
                'You cannot clear your own warns'
            );
        // if (member.roles.highest.position >= context.member.roles.highest.position)
        //   return this.sendErrorMessage(context, 0, 'You cannot clear the warns of someone with an equal or higher role');

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        this.client.db.users.updateWarns.run('', member.id, context.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('Clear Warns')
            .setDescription(`${member}'s warns have been successfully cleared.`)
            .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
            .addFields([{name: 'Member', value: member.toString(), inline: true}])
            .addFields([{name: 'Warn Count', value: '`0`', inline: true}])
            .addFields([{name: 'Reason', value: reason}])
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.sendReply(context, {embeds: [embed]});

        // Update mod log
        this.sendModLogMessage(context, reason, {
            Member: member,
            'Warn Count': '`0`',
        });
    }
};
