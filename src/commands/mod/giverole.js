const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class RoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'giverole',
            aliases: ['role', 'rolegive'],
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

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        try {
            await this.addRole(member, role, interaction);
            await this.sendReply(interaction, `${emojis.success} Gave ${role.toString()} role to ${member.toString()}`);
        }
        catch (err) {
            this.sendErrorMessage(interaction, 0, 'Failed to give role', err.message);
        }
    }

    async run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, this)]});
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
            const embed = new EmbedBuilder()
                .setTitle('Role')
                .setDescription(`Changed roles for ${member}.`)
                .addFields([{name: 'Moderator', value:  message.member.toString(), inline:  true}])
                .addFields([{name: 'Member', value:  member.toString(), inline:  true}])
                .addFields([{name: 'Roles', value:  changes.join('\n') || 'None', inline:  true}])
                .setFooter({
                    text: message.member.displayName,
                    iconURL: this.getAvatarURL(message.author),
                })
                .setTimestamp()
                .setColor(message.guild.members.me.displayHexColor);

            if (failed.length) embed.addFields([{name: 'Failed', value:  failed.join('\n'), inline:  true}]);
            return message.channel.send({embeds: [embed]});
        }
    }

    async RemoveRole(member, role, message) {
        if (role.editable) {
            try {
                await member.roles.remove(role);
                await this.sendModLogMessage(message, ' ', {
                    Member: member,
                    Role: role,
                });
                return `-${role}`;
            }
            catch (err) {
                this.client.logger.error(err.stack);
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
                await this.sendModLogMessage(message, '', {Member: member, Role: role});
                return `+${role}`;
            }
            catch (err) {
                this.client.logger.error(err.stack);
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
