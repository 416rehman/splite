const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine, stripIndent} = require('common-tags');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class SetNicknameCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setnickname',
            aliases: ['setnn', 'snn', 'nickname', 'nn', 'changenickname'],
            usage: 'setnickname <user mention/ID> <nickname>',
            description: oneLine`
        Changes the provided user's nickname to the one specified.
        The nickname cannot be larger than 32 characters.
      `,
            type: client.types.MOD,
            clientPermissions: [
                'SEND_MESSAGES',
                'EMBED_LINKS',
                'MANAGE_NICKNAMES',
            ],
            userPermissions: ['MANAGE_NICKNAMES'],
            examples: [
                'setnickname @split Noodles',
                'setnickname @split "Val Kilmer"',
            ],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to change the nickname of').setRequired(true))
                .addStringOption(s => s.setName('nickname').setDescription('The new nickname').setRequired(true))
        });
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Set Nickname', this)]});
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );

        if (!args[1])
            return this.sendErrorMessage(message, 0, 'Please provide a nickname');
        args.shift();
        // Multi-word nickname
        let nickname = args.join(' ');

        this.handle(member, nickname, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;
        const nickname = interaction.options.getString('nickname');
        this.handle(member, nickname, interaction);
    }

    async handle(member, nickname, context) {
        if (member.roles.highest.position >= context.member.roles.highest.position && member != context.member) {
            return this.sendErrorMessage(
                context,
                0,
                stripIndent`
        You cannot change the nickname of someone with an equal or higher role
      `
            );
        }

        if (!nickname.length) return this.sendErrorMessage(context, 0, 'Please provide a nickname');

        if (nickname.length > 32) {
            return this.sendErrorMessage(
                context,
                0,
                'Please ensure the nickname is not longer than 32 characters'
            );
        }
        else {
            try {
                // Change nickname
                const oldNickname = member.nickname || '`None`';
                const nicknameStatus = `${oldNickname} ➔ ${nickname}`;
                await member.setNickname(nickname);
                const embed = new MessageEmbed()
                    .setTitle('Set Nickname')
                    .setDescription(`${member}'s nickname was successfully updated.`)
                    .addField('Moderator', context.member.toString(), true)
                    .addField('Member', member.toString(), true)
                    .addField('Nickname', nicknameStatus, true)
                    .setFooter({
                        text: context.member.displayName,
                        iconURL: this.getAvatarURL(context.author),
                    })
                    .setTimestamp()
                    .setColor(context.guild.me.displayHexColor);
                this.sendReply(context, {embeds: [embed]});

                // Update mod log
                this.sendModLogMessage(context, '', {
                    Member: member,
                    Nickname: nicknameStatus,
                });
            }
            catch (err) {
                this.client.logger.error(err.stack);
                this.sendErrorMessage(
                    context,
                    1,
                    'Please check the role hierarchy',
                    err.context
                );
            }
        }
    }
};
