const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class RoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'role',
            aliases: ['giverole'],
            usage: 'role <user mention/ID> <role mention/ID>',
            description:
                'Adds/Removes the specified role from the provided user.\nSeperate multiple roles with a comma ","\nUsing + at the beginning of the role adds the role but does not remove it\nUsing - at the beginning of the role removes the role but does not add it',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: [
                'role @split rolename',
                'role @split rolename, +rolename2, -rolename3',
            ],
        });
    }

    async run(message, args) {
        if (!args[0]) return this.sendHelpMessage(message);
        const memberArg = args.shift();
        const member = await this.getGuildMember(message.guild, memberArg);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Failed to find the user. Please try again'
            );
        // if (!member.manageable) return this.sendErrorMessage(message, 0, `Please check the role hierarchy`);
        if (!args[0])
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a valid role to assign'
            );

        args = args.map((arg) => {
            let role = arg.trim();
            if (role.startsWith(',') || role.endsWith(','))
                role = role.replace(',', '');
            return role;
        });

        const changes = [];
        const failed = [];
        for (const arg of args) {
            if (arg.startsWith('+')) {
                const cleanedArg = arg.replace('+', '');
                const role = await this.getGuildRole(message.guild, cleanedArg);
                if (!role)
                    return this.sendErrorMessage(
                        message,
                        0,
                        `Failed to find that role (${cleanedArg}), try using a role ID`
                    );
                const change = await this.addRole(member, role, message);
                if (change) changes.push(change);
                else failed.push(`+${role}`);
            }
            else if (arg.startsWith('-')) {
                const cleanedArg = arg.replace('-', '');
                const role = await this.getGuildRole(message.guild, cleanedArg);
                if (!role)
                    return this.sendErrorMessage(
                        message,
                        0,
                        `Failed to find that role (${cleanedArg}), try using a role ID`
                    );
                const change = await this.RemoveRole(member, role, message);
                if (change) changes.push(change);
                else failed.push(`-${role}`);
            }
            else {
                const role = await this.getGuildRole(message.guild, arg);
                if (!role)
                    return this.sendErrorMessage(
                        message,
                        0,
                        `Failed to find that role (${arg}), try using a role ID`
                    );
                // If member already has role remove it, else add it.
                if (member.roles.cache.has(role.id)) {
                    const change = await this.RemoveRole(member, role, message);
                    if (change) changes.push(change);
                    else failed.push(`-${role}`);
                }
                else {
                    const change = await this.addRole(member, role, message);
                    if (change) changes.push(change);
                    else failed.push(`+${role}`);
                }
            }
        }

        if (changes.length || failed.length) {
            const embed = new MessageEmbed()
                .setTitle('Role')
                .setDescription(`Changed roles for ${member}.`)
                .addField('Moderator', message.member.toString(), true)
                .addField('Member', member.toString(), true)
                .addField('Roles', changes.join('\n') || 'None', true)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL({dynamic: true}),
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            console.log(failed.length);
            if (failed.length) embed.addField('Failed', failed.join('\n'), true);
            return message.channel.send({embeds: [embed]});
        }
    }

    async RemoveRole(member, role, message) {
        if (role.editable) {
            try {
                await member.roles.remove(role);
                this.sendModLogMessage(message, ' ', {
                    Member: member,
                    Role: role,
                });
                return `-${role}`;
            }
            catch (err) {
                message.client.logger.error(err.stack);
                return this.sendErrorMessage(
                    message,
                    1,
                    `Please check the role hierarchy\n${err.message}`,
                    err.message
                );
            }
        }
    }

    async addRole(member, role, message) {
        if (role.editable) {
            try {
                await member.roles.add(role);
                this.sendModLogMessage(message, '', {Member: member, Role: role});
                return `+${role}`;
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
        }
    }
};
