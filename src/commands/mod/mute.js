const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const ms = require('ms');
const {MessageButton} = require('discord.js');
const {MessageActionRow} = require('discord.js');

module.exports = class MuteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mute',
            aliases: ['gulag'],
            usage: 'mute <user mention/ID> <time> [reason]',
            description:
                'Mutes a user for the specified amount of time (max is 14 days).',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['mute @split 10s', 'mute @split 30m talks too much'],
            exclusive: true,
        });
    }

    async run(message, args) {
        if (!args[0]) {
            this.done(message.author.id);
            return this.sendHelpMessage(message);
        }
        const muteRoleId = message.client.db.settings.selectMuteRoleId
            .pluck()
            .get(message.guild.id);
        let muteRole;
        if (muteRoleId) muteRole = message.guild.roles.cache.get(muteRoleId);
        else {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                1,
                'There is currently no mute role set on this server\nCheck out the "setMuteRole" command'
            );
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
            return this.sendErrorMessage(message, 0, 'You cannot mute yourself');
        }
        if (member === message.guild.me) {
            this.done(message.author.id);
            return this.sendErrorMessage(message, 0, 'You cannot mute me');
        }
        // if (member.roles.highest.position >= message.member.roles.highest.position)
        //   return this.sendErrorMessage(message, 0, 'You cannot mute someone with an equal or higher role');
        let time = ms('5m');
        if (args[1]) time = ms(args[1]);

        if (!time || time > 1209600000) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Please enter a length of time of 14 days or less (1s/m/h/d)'
            );
        }

        let reason = args.slice(2).join(' ');
        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        if (member.roles.cache.has(muteRoleId)) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Provided member is already muted'
            );
        }

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
                        .setTitle('Mute Member')
                        .setDescription(
                            `Do you want to mute ${member} for **${ms(time, {
                                long: true,
                            })}**?`
                        )
                        .setFooter({text: 'Expires in 15s'}),
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
                        // Mute member
                        try {
                            await member.roles.add(muteRole);
                        }
                        catch (err) {
                            message.client.logger.error(err.stack);
                            return this.sendErrorMessage(
                                message,
                                1,
                                'Please check the role hierarchy',
                                err.message
                            );
                        }
                        const muteEmbed = new MessageEmbed()
                            .setTitle('Mute Member')
                            .setDescription(
                                `${member} has now been muted for **${ms(time, {
                                    long: true,
                                })}**.`
                            )
                            .addField('Moderator', message.member.toString(), true)
                            .addField('Member', member.toString(), true)
                            .addField('Time', `\`${ms(time)}\``, true)
                            .addField('Reason', reason)
                            .setFooter({
                                text: message.member.displayName,
                                iconURL: message.author.displayAvatarURL({
                                    dynamic: true,
                                }),
                            })
                            .setTimestamp()
                            .setColor(message.guild.me.displayHexColor);
                        message.channel.send({embeds: [muteEmbed]});

                        // Unmute member
                        member.timeout = setTimeout(async () => {
                            try {
                                await member.roles.remove(muteRole);
                                const unmuteEmbed = new MessageEmbed()
                                    .setTitle('Unmute Member')
                                    .setDescription(`${member} has been unmuted.`)
                                    .setTimestamp()
                                    .setColor(message.guild.me.displayHexColor);
                                message.channel.send({embeds: [unmuteEmbed]});
                            }
                            catch (err) {
                                message.client.logger.error(err.stack);
                                return this.sendErrorMessage(
                                    message,
                                    1,
                                    'Please check the role hierarchy',
                                    err.message
                                );
                            }
                        }, time);

                        // Update mod log
                        this.sendModLogMessage(message, reason, {
                            Member: member,
                            Time: `\`${ms(time)}\``,
                        });
                    }
                    else {
                        updated = true;
                        msg.edit({
                            components: [],
                            embeds: [
                                new MessageEmbed()
                                    .setTitle('Mute Member')
                                    .setDescription(`${member} Not Muted - Cancelled`),
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
                                .setTitle('Mute Member')
                                .setDescription(`${member} Not Muted - Expired`),
                        ],
                    });
                });
            });
    }
};
