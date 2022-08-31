const Command = require('../Command.js');
const {MessageActionRow} = require('discord.js');
const {MessageButton} = require('discord.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class BanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ban',
            usage: 'ban <user mention/ID> [reason]',
            description: 'Bans a member from your server indefinitely',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'],
            userPermissions: ['BAN_MEMBERS'],
            examples: ['ban @split'],
            exclusive: true,
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to ban').setRequired(true))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the ban').setRequired(false))
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
        if (member === context.member) {
            this.done(context.author.id);
            return this.sendErrorMessage(context, 0, 'You cannot ban yourself');
        }
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

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('proceed')
                    .setLabel('✅ Proceed')
                    .setStyle('SUCCESS')
            ).addComponents(
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('❌ Cancel')
                    .setStyle('DANGER')
            );

        const payload = {
            embeds: [
                new MessageEmbed()
                    .setTitle('Ban Member')
                    .setDescription(`Do you want to ban ${member}?`)
                    .setFooter({
                        text: 'Expires in 15 seconds',
                        iconURL: this.getAvatarURL(context.author),
                    }),
            ],
            components: [row],
        };

        this.sendReply(context, payload).then((msg) => {
            const filter = (button) => button.user.id === context.author.id;
            const collector = msg.createMessageComponentCollector({
                filter,
                componentType: 'BUTTON',
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

                        const embed = new MessageEmbed()
                            .setTitle('Ban Member')
                            .setDescription(`${member} was successfully banned.`)
                            .addField('Moderator', context.member.toString(), true)
                            .addField('Member', member.toString(), true)
                            .addField('Reason', reason)
                            .setFooter({
                                text: context.member.displayName,
                                iconURL: this.getAvatarURL(context.author),
                            })
                            .setTimestamp()
                            .setColor(context.guild.me.displayHexColor);
                        msg.edit({embeds: [embed], components: []});
                        this.client.logger.info(
                            `${context.guild.name}: ${context.author.tag} banned ${member.user.tag}`
                        );
                        // Update mod log
                        this.sendModLogMessage(context, reason, {Member: member});
                    }
                    catch (e) {
                        this.sendErrorMessage(context, 0, 'The provided member is not bannable');
                        this.client.logger.error(e);
                    }

                }
                else {
                    msg.edit({
                        components: [],
                        embeds: [
                            new MessageEmbed()
                                .setTitle('Ban Member')
                                .setDescription(`${member} Not banned - Cancelled`),
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
                        new MessageEmbed()
                            .setTitle('Ban Member')
                            .setDescription(`${member} Not banned - Expired`),
                    ],
                });
            });
        });
    }
};
