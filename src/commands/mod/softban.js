const Command = require('../Command.js');
const {ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ComponentType} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class SoftBanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'softban',
            usage: 'softban <user mention/ID> [reason]',
            description: 'Bans a member then immediately unbans. This wipes all messages from that member from your server.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'],
            userPermissions: ['BAN_MEMBERS'],
            examples: ['softban @split'],
            exclusive: true,
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to softban').setRequired(true))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the softban').setRequired(false))
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

        this.handle(member, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        this.handle(member, reason, interaction);
    }

    handle(member, reason, context) {
        if (member.id === context.member.id) {
            this.done(context.author.id);
            return this.sendErrorMessage(
                context,
                0,
                'You cannot softban yourself'
            );
        }
        if (member.roles.highest.position >= context.member.roles.highest.position) {
            this.done(context.author.id);
            return this.sendErrorMessage(
                context,
                0,
                'You cannot softban someone with an equal or higher role'
            );
        }
        //
        // if (!member.bannable) {
        //     this.done(context.author.id);
        //     return this.sendErrorMessage(
        //         context,
        //         0,
        //         'Provided member is not bannable'
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
                    .setTitle('Softban Member')
                    .setDescription(`Do you want to softban ${member}?`)
                    .setFooter({text: 'Expires in 15s'}),
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
                updated = true;
                if (b.customId === 'proceed') {
                    try {
                        await member.ban({reason: reason});
                        await context.guild.members.unban(member.user, reason);

                        const embed = new EmbedBuilder()
                            .setTitle('Softban Member')
                            .setDescription(`${member} was successfully softbanned.`)
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
                            `${context.guild.name}: ${context.author.tag} softbanned ${member.user.tag}`
                        );

                        // Update mod log
                        await this.sendModLogMessage(context, reason, {
                            Member: member,
                        });
                        this.done(context.author.id);
                    }
                    catch (err) {
                        this.client.logger.error(err);
                        this.done(context.author.id);
                        return this.sendErrorMessage(
                            context,
                            0,
                            'An error occurred while softbanning the member'
                        );
                    }
                }
                else {
                    this.done(context.author.id);
                    msg.edit({
                        components: [],
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Soft Ban Member')
                                .setDescription(
                                    `${member} Not softbanned - Cancelled`
                                ),
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
                            .setTitle('Soft Ban Member')
                            .setDescription(`${member} Not softbanned - Expired`),
                    ],
                });
            });
        });
    }
};
