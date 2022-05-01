const Command = require('../Command.js');
const {MessageButton} = require('discord.js');
const {MessageActionRow} = require('discord.js');
const {MessageEmbed} = require('discord.js');

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
        });
    }

    async run(message, args) {
        if (!args[0]) {
            this.done(message.author.id);
            return this.sendHelpMessage(message);
        }
        const member =
            await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        }
        if (member === message.member) {
            this.done(message.author.id);
            return this.sendErrorMessage(message, 0, 'You cannot kick yourself');
        }
        if (!member.kickable) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Provided member is not kickable'
            );
        }

        let reason = args.slice(1).join(' ');
        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        const row = new MessageActionRow();
        row.addComponents(
            new MessageButton()
                .setCustomId('proceed')
                .setLabel('✅ Proceed')
                .setStyle('SUCCESS')
        );
        row.addComponents(
            new MessageButton()
                .setCustomId('cancel')
                .setLabel('❌ Cancel')
                .setStyle('DANGER')
        );
        message.channel
            .send({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Kick Member')
                        .setDescription(`Do you want to kick ${member}?`)
                        .setFooter({
                            text: 'Expires in 15s',
                            iconURL: message.author.avatarURL(),
                        }),
                ],
                components: [row],
            })
            .then((msg) => {
                const filter = (button) => button.user.id === message.author.id;
                const collector = msg.createMessageComponentCollector({
                    filter,
                    componentType: 'BUTTON',
                    time: 15000,
                    dispose: true,
                });

                let updated = false;
                collector.on('collect', async (b) => {
                    this.done(message.author.id);
                    if (b.customId === 'proceed') {
                        await member.kick(reason);

                        const embed = new MessageEmbed()
                            .setTitle('Kick Member')
                            .setDescription(`${member} was successfully kicked.`)
                            .addField('Moderator', message.member.toString(), true)
                            .addField('Member', member.toString(), true)
                            .addField('Reason', reason)
                            .setFooter({
                                text: message.member.displayName,
                                iconURL: message.author.displayAvatarURL({
                                    dynamic: true,
                                }),
                            })
                            .setTimestamp()
                            .setColor(message.guild.me.displayHexColor);
                        msg.edit({embeds: [embed], components: []});
                        message.client.logger.info(
                            `${message.guild.name}: ${message.author.tag} kicked ${member.user.tag}`
                        );
                        updated = true;
                        // Update mod log
                        this.sendModLogMessage(message, reason, {Member: member});
                    }
                    else {
                        updated = true;
                        msg.edit({
                            components: [],
                            embeds: [
                                new MessageEmbed()
                                    .setTitle('Kick Member')
                                    .setDescription(`${member} Not Kicked - Cancelled`),
                            ],
                        });
                    }
                });
                collector.on('end', () => {
                    this.done(message.author.id);
                    if (updated) return;
                    msg.edit({
                        components: [],
                        embeds: [
                            new MessageEmbed()
                                .setTitle('Kick Member')
                                .setDescription(`${member} Not Kicked - Expired`),
                        ],
                    });
                });
            });
    }
};
