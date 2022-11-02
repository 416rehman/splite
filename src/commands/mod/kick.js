const Command = require('../Command.js');
const {ButtonBuilder,ActionRowBuilder, EmbedBuilder, ButtonStyle, ComponentType} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class KickCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'kick',
            usage: 'kick <user mention/ID> [reason]',
            description: 'Kicks a member from your server.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS'],
            userPermissions: ['KICK_MEMBERS'],
            examples: ['kick @split'],
            exclusive: true,
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to kick'))
                .addStringOption(s => s.setName('reason').setRequired(false).setDescription('The reason for the kick'))
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

        let reason = args.slice(1).join(' ');

        this.handle(member, reason, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        this.handle(member, reason, interaction);
    }

    handle(member, reason, context) {
        if (member === context.member) {
            this.done(context.author.id);
            return this.sendErrorMessage(context, 0, 'You cannot kick yourself');
        }

        // if (!member.kickable) {
        //     this.done(message.author.id);
        //     return this.sendErrorMessage(
        //         message,
        //         0,
        //         'Provided member is not kickable'
        //     );
        // }

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('proceed')
                .setLabel('✅ Proceed')
                .setStyle(ButtonStyle.Success)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        const payload = {
            embeds: [
                new EmbedBuilder()
                    .setTitle('Kick Member')
                    .setDescription(`Do you want to kick ${member}?`)
                    .setFooter({
                        text: 'Expires in 15s',
                        iconURL: this.getAvatarURL(context.author)
                    }),
            ],
            components: [row],
        };
        this.sendReply(context, payload).then((msg) => {
            const filter = (button) => button.user.id === context.author.id;
            const collector = msg.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 15000,
                dispose: true,
            });

            let updated = false;
            collector.on('collect', async (b) => {
                this.done(context.author.id);
                if (b.customId === 'proceed') {
                    try {
                        await member.kick(reason);

                        const embed = new EmbedBuilder()
                            .setTitle('Kick Member')
                            .setDescription(`${member} was successfully kicked.`)
                            .addFields([{name: 'Moderator', value:  context.member.toString(), inline:  true}])
                            .addFields([{name: 'Member', value:  member.toString(), inline:  true}])
                            .addFields([{name: 'Reason', value:  reason}])
                            .setFooter({
                                text: context.member.displayName,
                                iconURL: context.author.displayAvatarURL({
                                    dynamic: true,
                                }),
                            })
                            .setTimestamp()
                            .setColor(context.guild.members.me.displayHexColor);
                        msg.edit({embeds: [embed], components: []});
                        this.client.logger.info(
                            `${context.guild.name}: ${context.author.tag} kicked ${member.user.tag}`
                        );
                        updated = true;
                        // Update mod log
                        await this.sendModLogMessage(context, reason, {Member: member});
                    }
                    catch (e) {
                        this.sendErrorMessage(context, 0, 'Failed to kick member - Not kickable');
                        this.client.logger.error(e);
                    }

                }
                else {
                    updated = true;
                    msg.edit({
                        components: [],
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Kick Member')
                                .setDescription(`${member} Not Kicked - Cancelled`),
                        ],
                    });
                }
            });
            collector.on('end', () => {
                this.done(context.author.id);
                if (updated) return;
                msg.edit({
                    components: [],
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Kick Member')
                            .setDescription(`${member} Not Kicked - Expired`),
                    ],
                });
            });
        });
    }
};
