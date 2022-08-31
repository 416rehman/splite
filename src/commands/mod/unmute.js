const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class UnmuteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'unmute',
            aliases: ['ungulag'],
            usage: 'unmute <user mention/ID>',
            description: 'Unmutes the specified user.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['unmute @split'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to unmute').setRequired(true))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the unmute').setRequired(false))
        });
    }

    async run(message, args) {
        if (!args[0]) {
            this.done(message.author.id);
            return message.reply({embeds: [this.createHelpEmbed(message, this)]});
        }
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        }

        const reason = args[1] || '`None`';


        this.handle(member, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        this.handle(member, reason, interaction);
    }

    async handle(member, reason, context) {
        const muteRoleId = this.client.db.settings.selectMuteRoleId
            .pluck()
            .get(context.guild.id);
        let muteRole;
        if (muteRoleId) muteRole = context.guild.roles.cache.get(muteRoleId);
        else return this.sendErrorMessage(
            context,
            1,
            'There is currently no mute role set on this server'
        );

        if (!member)
            return this.sendErrorMessage(
                context,
                0,
                'Please mention a user or provide a valid user ID'
            );

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        if (!member.roles.cache.has(muteRoleId))
            return this.sendErrorMessage(
                context,
                0,
                'Provided member is not muted'
            );

        // Unmute member
        clearTimeout(member.timeout);
        try {
            await member.roles.remove(muteRole);
            const embed = new MessageEmbed()
                .setTitle('Unmute Member')
                .setDescription(`${member} has been unmuted.`)
                .addField('Reason', reason)
                .setFooter({
                    text: context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp()
                .setColor(context.guild.me.displayHexColor);
            this.sendReply(context, {embeds: [embed]});
        }
        catch (err) {
            this.client.logger.error(err.stack);
            return this.sendErrorMessage(
                context,
                1,
                'Please check the role hierarchy',
                err.context
            );
        }

        // Update mod log
        this.sendModLogMessage(context, reason, {Member: member});
    }
};
