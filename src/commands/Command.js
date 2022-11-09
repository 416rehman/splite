const {EmbedBuilder} = require('discord.js');
const {permissions} = require('../utils/constants.json');
const {Collection} = require('discord.js');
const {fail} = require('../utils/emojis.json');
const emojis = require('../utils/emojis.json');
const {capitalize} = require('../utils/utils');

/**
 * Command class
 */
class Command {
    /**
     * Create new command
     * @param {Client} client
     * @param {Object} options
     */
    constructor(client, options) {
        // Validate all options passed
        this.constructor.validateOptions(client, options);

        /**
         * The client
         * @type {Client}
         */
        this.client = client;

        /**
         * Name of the command
         * @type {string}
         */
        this.name = options.name;

        /**
         * Aliases of the command
         * @type {Array<string>}
         */
        this.aliases = options.aliases || null;

        /**
         * The arguments for the command
         * @type {string}
         */
        this.usage = options.usage || options.name;

        /**
         * The description for the command
         * @type {string}
         */
        this.description = options.description || '';

        /**
         * The type of command
         * @type {string}
         */
        this.type = options.type || client.types.MISC;

        /**
         * The client permissions needed
         * @type {Array<string>}
         */
        this.clientPermissions = options.clientPermissions || [
            'SEND_MESSAGES',
            'EMBED_LINKS',
        ];

        /**
         * The user permissions needed
         * @type {Array<string>}
         */
        this.userPermissions = options.userPermissions || null;

        /**
         * Examples of how the command is used
         * @type {Array<string>}
         */
        this.examples = options.examples || null;

        /**
         * If command can only be used by owner
         * @type {boolean}
         */
        this.nsfwOnly = options.nsfwOnly || this.type === 'NSFW 18+';

        /**
         * If command is enabled. config.yaml has higher precedence.
         * if the command is disabled in config.yaml, it will be disabled regardless of this value.
         * @type {boolean}
         */
        this.disabled = options.disabled || false;
        if (this.client?.config?.disabledCommands?.includes(this.name)) this.disabled = true;

        /**
         * Array of error types
         * @type {Array<string>}
         */
        this.errorTypes = ['Invalid Argument', 'Command Failure'];

        /**
         * Cooldown in seconds (default = 2)
         * @type {number}
         */
        this.cooldown = (options.cooldown || 2) * 1000;

        if (this.cooldown) this.cooldowns = new Collection();

        /**
         * If true, only one instance of the command will run per user until the done() method is called. Good for heavy commands.
         */
        this.exclusive = options.exclusive;
        if (this.exclusive) this.instances = new Collection();

        /**
         * Slash command options
         */
        if (options.slashCommand) {
            this.slashCommand = options.slashCommand;
            if (!this.slashCommand.name) this.slashCommand.setName(this.name); // Implicitly set the name to the command name if not set
            if (this.type === this.client.types.OWNER)
                this.slashCommand.setDescription(('OWNER COMMAND: ' + this.description).substring(0, 100));
            else if (this.type === this.client.types.MANAGER)
                this.slashCommand.setDescription(('MANAGER COMMAND: ' + this.description).substring(0, 100));
            else if (this.type === this.client.types.NSFW || this.nsfwOnly)
                this.slashCommand.setDescription(('NSFW COMMAND: ' + this.description).substring(0, 100));
            else this.slashCommand.setDescription(this.description.substring(0, 100));
        }

        /**
         * If true, the command will only be run if the author is in a voice channel
         */
        this.voiceChannelOnly = options.voiceChannelOnly;

        /**
         * If true, only one instance of the command will run per channel until the done() method is called. Good for heavy commands.
         */
        this.channelExclusive = options.channelExclusive;
        if (this.channelExclusive) this.channelInstances = new Collection();
    }

    /**
     * Validates all options provided
     * Code modified from: https://github.com/discordjs/Commando/blob/master/src/commands/base.js
     * @param {Client} client
     * @param {Object} options
     */
    static validateOptions(client, options) {
        if (!client) throw new Error('No client was found');
        if (typeof options !== 'object')
            throw new TypeError('Command options is not an Object');

        // Name
        if (typeof options.name !== 'string')
            throw new TypeError('Command name is not a string');
        if (options.name !== options.name.toLowerCase())
            throw new Error('Command name is not lowercase');

        // Aliases
        if (options.aliases) {
            if (
                !Array.isArray(options.aliases) ||
                options.aliases.some((ali) => typeof ali !== 'string')
            )
                throw new TypeError('Command aliases is not an Array of strings');

            if (options.aliases.some((ali) => ali !== ali.toLowerCase()))
                throw new RangeError('Command aliases are not lowercase');

            for (const alias of options.aliases) {
                if (client.aliases.get(alias))
                    throw new Error(alias + ' Command alias already exists');
            }
        }

        // Usage
        if (options.usage && typeof options.usage !== 'string')
            throw new TypeError('Command usage is not a string');

        // Description
        if (options.description && typeof options.description !== 'string')
            throw new TypeError('Command description is not a string');

        // Type
        if (options.type && typeof options.type !== 'string')
            throw new TypeError('Command type is not a string');
        if (options.type && !Object.values(client.types).includes(options.type))
            throw new Error('Command type is not valid');

        // Client permissions
        if (options.clientPermissions) {
            if (!Array.isArray(options.clientPermissions))
                throw new TypeError(
                    'Command clientPermissions is not an Array of permission key strings'
                );

            for (const perm of options.clientPermissions) {
                if (!permissions[perm])
                    throw new RangeError(
                        `Invalid command clientPermission: ${perm}`
                    );
            }
        }

        // User permissions
        if (options.userPermissions) {
            if (!Array.isArray(options.userPermissions))
                throw new TypeError(
                    'Command userPermissions is not an Array of permission key strings'
                );

            for (const perm of options.userPermissions) {
                if (!permissions[perm])
                    throw new RangeError(`Invalid command userPermission: ${perm}`);
            }
        }


        // Examples
        if (options.examples && !Array.isArray(options.examples))
            throw new TypeError(
                'Command examples is not an Array of permission key strings'
            );

        // Disabled
        if (options.disabled && typeof options.disabled !== 'boolean')
            throw new TypeError('Command disabled is not a boolean');

        // Cooldown
        if (options.cooldown && typeof options.cooldown !== 'number')
            throw new TypeError('Command cooldown is not a number');

        // Exclusive
        if (options.exclusive && typeof options.exclusive !== 'boolean')
            throw new TypeError('Command exclusive is not a boolean');

        // VoceChannelOnly
        if (
            options.voiceChannelOnly &&
            typeof options.voiceChannelOnly !== 'boolean'
        )
            throw new TypeError('Command voiceChannelOnly is not a boolean');

        // ChannelExclusive
        if (
            options.channelExclusive &&
            typeof options.channelExclusive !== 'boolean'
        )
            throw new TypeError('Command channelExclusive is not a boolean');
    }

    /**
     * Runs the command - Call this in your command class
     * @param  message
     * @param args
     */
    // run(message, args) {
    //     throw {name: 'NotImplementedError', message: `${this.name} run method not implemented`};
    // }

    /**
     * Interacts with the slash command - Call this in your command class if using the slash command
     */
    // interact(interaction, args, author) {
    //     throw {name: 'NotImplementedError', message: `${this.name} interact method not implemented`};
    // }

    /**
     * If this.exclusive or this.channelExclusive is true, this method will finish the commands execution and allow any future instance of the command to run
     * Pass both userId and channelId to finish the command for both user and channel, otherwise pass only the userId or the channelId to finish the command for only one of them.
     *
     * @param userId
     * @param channelId
     */
    done(userId, channelId) {
        if (userId) {
            if (!this.exclusive) return;
            this.instances.delete(userId);
        }
        if (channelId) {
            if (!this.channelExclusive) return;
            this.channelInstances.delete(channelId);
        }
    }

    /**
     * Pass a userId and or a channelId to set the command as being used by the user or channel respectively. Requires this.exclusive or this.channelExclusive to be true.
     * @param userId
     * @param channelId
     */
    setInstance(userId, channelId) {
        if (userId && this.exclusive) {
            this.instances.set(userId, Date.now());
        }

        if (channelId && this.channelExclusive) {
            this.channelInstances.set(channelId, Date.now());
        }
    }

    /**
     * If exclusive or channelExclusive is true, this method will return true if the command is being used by the user or channel respectively.
     * @param userId
     * @param channelId
     * @returns {any}
     */
    isInstanceRunning(userId, channelId) {
        let isUserInstanceRunning = false;
        let isChannelInstanceRunning = false;

        if (userId && this.exclusive && this.instances) {
            const userInstance = this.instances.get(userId);
            if (userInstance) {
                //if instance was started more than 5 minutes ago, force-reset it.
                if (Date.now() - userInstance > 1000 * 60 * 5) {
                    this.done(userId, null);
                    isUserInstanceRunning = false;
                }

                isUserInstanceRunning = true;
            }
        }

        if (channelId && this.channelExclusive && this.channelInstances) {
            const channelInstance = this.channelInstances.get(channelId);
            if (channelInstance) {
                //if instance was started more than 5 minutes ago, force-reset it.
                if (Date.now() - channelInstance > 1000 * 60 * 5) {
                    this.done(null, channelId);
                    isChannelInstanceRunning = false;
                }
                isChannelInstanceRunning = true;
            }
        }

        return isUserInstanceRunning || isChannelInstanceRunning;
    }

    /**
     * Sets cooldown for the user
     * @param userId
     */
    setCooldown(userId) {
        if (!this.cooldown) return;
        this.cooldowns.set(userId, Date.now() + this.cooldown);
    }

    /**
     * Check if user is on cooldown
     * @param userId
     * @returns {Promise<number> || null}
     */
    async isOnCooldown(userId) {
        if (!this.cooldown) return;
        const uCooldown = await this.cooldowns.get(userId);
        if (uCooldown > Date.now()) return (uCooldown - Date.now()) / 1000;
        else this.cooldowns.delete(userId);
    }

    /**
     * Gets member from mention
     * @param {Message} message
     * @param {string} mention
     */
    getMemberFromMention(guild, mention) {
        if (!mention) return;
        const userId = this.isMention(mention, 'user');
        if (!userId) return;
        return guild.members.fetch(userId);
    }

    /**
     * Gets member from text or id
     * @param guild
     * @param {string} text
     */
    async getMemberFromText(guild, text) {
        if (!text) return;
        if (this.isSnowflake(text)) return await guild.members.fetch(text);
        else {
            return (await guild.members.fetch({
                query: text,
            })).first();
        }
    }

    /**
     * Gets a member from id, username, or mention
     */
    async getGuildMember(guild, text) {
        return await this.getMemberFromMention(guild, text) || this.getMemberFromText(guild, text);
    }

    /**
     * Gets avatar from author/user/member
     * @param user the user to get avatar from
     * @param type enforces avatar type (i.e 'png' or 'gif')
     */
    getAvatarURL(user, type) {
        const options = {dynamic: true, size: 2048};
        if (type) options.format = type;

        if (user?.avatar?.startsWith('a_') || user?.user?.avatar?.startsWith('a_')) {
            return `https://cdn.discordapp.com/avatars/${user.id || user.user.id}/${user.avatar || user.user.avatar}.gif?size=2048`;
        }
        else {
            return `https://cdn.discordapp.com/avatars/${user.id || user.user.id}/${user.avatar || user.user.avatar}.png?size=2048`;
        }
    }

    getUserIdentifier(user) {
        return user?.tag || user?.displayName || user?.username + user?.discriminator;
    }

    /**
     * Gets role from mention
     * @param {Message} message
     * @param {string} mention
     */
    getRoleFromMention(guild, mention) {
        if (!mention) return;
        const roleId = this.isMention(mention, 'role');
        if (!roleId) return;
        return guild.roles.cache.get(roleId);
    }

    /**
     * Gets role from text, mention, or ID
     * @param {Message} message
     * @param {string} text
     */
    getGuildRole(guild, text) {
        if (text) {
            let role = null;

            if (this.isMention(text, 'role'))
                role =
                    this.getRoleFromMention(guild, text) ||
                    guild.roles.cache.get(text);
            else
                role =
                    guild.roles.cache.find(
                        r => r.id === text.toLowerCase()
                    ) || guild.roles.cache.find(
                        r => r.name.toLowerCase() === text.toLowerCase()
                    ) || guild.roles.cache.find(
                        r => r.name.toLowerCase().startsWith(text.toLowerCase())
                    );

            return role;
        }
    }

    /**
     *  Gets a user or a role from a mention, id, or name
     */
    async getGuildMemberOrRole(guild, text) {
        if (!text) return;
        const member = await this.getGuildMember(guild, text);
        if (member) return member;
        const role = await this.getGuildRole(guild, text);
        if (role) return role;
    }

    /**
     * Checks if a text is a valid mention
     * @param {string} text
     * @param {string} type The type of mention (i.e. 'user', 'role', 'channel')
     * @returns {string || null} Returns the ID of the mention if valid, otherwise null
     */
    isMention(text, type = 'user') {
        if (type === 'user') {
            const matches = text.match(/^<@!?(\d+)>$/);
            if (!matches) return null;
            return matches[1];
        }
        else if (type === 'role') {
            const matches = text.match(/^<@&(\d+)>$/);
            if (!matches) return null;
            return matches[1];
        }
        else if (type === 'channel') {
            const matches = text.match(/^<#(\d+)>$/)[1] || null;
            if (!matches) return null;
            return matches;
        }
    }

    /**
     * Checks if a text is snowflake
     */
    isSnowflake(text) {
        return /^[0-9]{18}$/g.test(text);
    }

    /**
     * Gets text channel from mention
     * @param {Message} message
     * @param {string} mention
     */
    getChannelFromMention(message, mention) {
        if (!mention) return;
        const matches = mention.match(/^<#(\d+)>$/);
        if (!matches) return;
        const id = matches[1];
        return message.guild.channels.cache.get(id);
    }

    /**
     * Returns false or an embed of errors if permissions are missing. Returns true if permission check is passed
     * @param member
     * @param channel
     * @param guild
     * @param ownerOverride
     * @returns {*|boolean|EmbedBuilder}
     */
    checkPermissionErrors(member, channel, guild, ownerOverride = true) {
        if (!channel.permissionsFor(guild.members.me).has(['SEND_MESSAGES', 'EMBED_LINKS']))
            return new EmbedBuilder()
                .setAuthor({
                    name: `${this.getUserIdentifier(member)}`,
                    iconURL: this.getAvatarURL(member),
                })
                .setTitle(`Missing Client Permissions: \`${this.name}\``)
                .setDescription(
                    '```SEND_MESSAGES```\n```EMBED_LINKS```'
                )
                .setTimestamp();
        const clientPermission = this.checkClientPermissions(channel, guild);
        if (clientPermission instanceof EmbedBuilder) return clientPermission;

        const userPermission = this.checkUserPermissions(
            member,
            channel,
            ownerOverride
        );
        if (userPermission instanceof EmbedBuilder || !userPermission) {
            return userPermission;
        }
        return true;
    }

    /**
     * Checks if nsfw perms are good
     * @param channel
     * @returns {boolean}
     */
    checkNSFW(channel) {
        if (!this.nsfwOnly && this.type != this.client.types.NSFW) return true;
        return channel.nsfw;
    }

    /**
     * Returns false, or an embed, if user doesn't have permission to run the command. Else returns true
     * @param member
     * @param channel
     * @param ownerOverride
     * @param perms
     * @returns {boolean|EmbedBuilder}
     */
    checkUserPermissions(member, channel, ownerOverride = true, perms = this.userPermissions) {
        // Override all permissions if owner and ownerOverride is true
        if (ownerOverride && this.client.isOwner(member)) {
            return true;
        }

        // Owner / Manager commands
        if (this.type === this.client.types.OWNER || this.type === this.client.types.MANAGER) {
            if (this.type === this.client.types.OWNER && this.client.isOwner(member)) {
                return true;
            }
            if (this.type === this.client.types.MANAGER && (this.client.isManager(member) || this.client.isOwner(member))) {
                return true;
            }
        }
        // User commands
        else {
            if (!perms || !perms.length) {
                return true;
            }

            if (perms) {
                const missingPermissions = channel
                    .permissionsFor(member)
                    .missing(perms)
                    .map((p) => permissions[p]);

                if (missingPermissions.length !== 0) {
                    return new EmbedBuilder()
                        .setAuthor({
                            name: `${this.getUserIdentifier(member)}`,
                            iconURL: this.getAvatarURL(member),
                        })
                        .setTitle(`Missing User Permissions: \`${this.name}\``)
                        .setDescription(
                            `\`\`\`diff\n${missingPermissions
                                .map((p) => `- ${p}`)
                                .join('\n')}\`\`\``
                        )
                        .setTimestamp();
                }
                else {
                    return true;
                }
            }

            if (member.permissions.has('ADMINISTRATOR')) {
                return true;
            }
        }

        return false;
    }

    checkClientPermissions(channel, guild, perms = this.clientPermissions) {
        const missingPermissions = channel
            .permissionsFor(guild.members.me)
            .missing(perms)
            .map((p) => permissions[p]);
        if (missingPermissions.length !== 0) {
            return new EmbedBuilder()
                .setAuthor({
                    name: `${this.client.user.tag}`,
                    iconURL: this.getAvatarURL(this.client.user),
                })
                .setTitle(`Missing Bot Permissions: \`${this.name}\``)
                .setDescription(
                    `\`\`\`diff\n${missingPermissions
                        .map((p) => `- ${p}`)
                        .join('\n')}\`\`\``
                )
                .setTimestamp();
        }
        return true;
    }

    //check if the message author is in a voice channel
    checkVoiceChannel(message) {
        if (this.voiceChannelOnly) {
            if (!message.member.voice.channel) {
                message.channel.send(
                    `You're not in a voice channel ${message.author}... try again ? ❌`
                );
                return false;
            }

            if (
                message.guild.members.me.voice.channel &&
                message.member.voice.channel.id !==
                message.guild.members.me.voice.channel.id
            ) {
                message.channel.send(
                    `You are not in the same voice channel ${message.author}... try again ? ❌`
                );
                return false;
            }

            // if the dj role is set, check if the user has it
            const DJ = this.client.config.music.DJ;
            if (DJ.enabled && DJ.commands.includes(this.name)) {
                const roleDJ = message.guild.roles.cache.find(
                    (x) => x.name.toLowerCase() === DJ.roleName.toLowerCase()
                );

                if (!roleDJ || !message.member._roles.includes(roleDJ.id)) {
                    message.channel.send(
                        `This command is reserved for members with the ${DJ.roleName} role on the server ${message.author}... try again ? ❌`
                    );
                    return false;
                }
            }
        }
        return true;
    }

    checkBlacklist(user) {
        //Don't blacklist bot owners
        if (this.client.isOwner(user)) return false;
        return this.client.db.blacklist.selectRow.pluck().get(user.id);
    }

    /**
     * Creates and sends command failure embed
     * @param {Message} context
     * @param {int} errorType
     * @param {string} reason
     * @param {string} errorMessage
     */
    sendErrorMessage(context, errorType, reason, errorMessage) {
        errorType = this.errorTypes[errorType];
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${this.getUserIdentifier(context.author)}`,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTitle(`${fail} Error: \`${this.name}\``)
            .setDescription(`\`\`\`diff\n- ${errorType}\n+ ${reason}\`\`\``)
            .addFields([{name: 'Usage', value:  `\`${prefix}${this.usage}\``}])
            .setTimestamp()
            .setColor();
        if (this.examples)
            embed.addField(
                'Examples',
                this.examples.map((e) => `\`${prefix}${e}\``).join('\n')
            );
        if (errorMessage)
            embed.addFields([{name: 'Error Message', value:  `\`\`\`${errorMessage}\`\`\``}]);
        this.sendReplyAndDelete(context, {embeds: [embed]});
    }

    /**
     * Creates and sends command help embed
     * @param {Message} message
     * @param command
     * @param prefix
     */
    createHelpEmbed(message, command, prefix = null) {
        if (!prefix) prefix = this.client.db.settings.selectPrefix.pluck().get(message.guild.id);
        let invocation = '';
        if (typeof command.run === 'function') {
            invocation += 'Text Command';
            if (typeof command.interact === 'function') invocation += ' + Slash Command';
            else invocation += ' Only';
        }
        else if (typeof command.interact === 'function') {
            invocation += 'Slash Command Only';
        }
        const embed = new EmbedBuilder()
            .setTitle(`Command: \`${command.name}\``)
            .setThumbnail(`${this.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
            .setDescription(command.description)
            .addFields([{name: 'Usage', value:  `\`${prefix}${command.usage}\``, inline:  true}])
            .addFields([{name: 'Type', value:  `\`${capitalize(command.type)}\``, inline:  true}])
            .addFields([{name: 'Invocation', value:  `\`${invocation}\``, inline:  true}])
            .setFooter({
                text: message.member.displayName, iconURL: this.getAvatarURL(message.author),
            })
            .setTimestamp()
            .setColor(message.guild.members.me.displayHexColor);
        if (command.aliases) embed.addFields([{name: 'Aliases', value:  command.aliases.map((c) => `\`${c}\``).join(' ')}]);
        if (command.examples) embed.addFields([{name: 'Examples', value:  command.examples.map((c) => `\`${prefix}${c}\``).join('\n')}]);
        return embed;
    }

    /**
     * Creates and sends mod log embed
     * @param {Object} message
     * @param {string} reason
     * @param {Object} fields
     */
    async sendModLogMessage(message, reason, fields = {}) {
        this.client.db.activities.updateModerations.run({
            userId: message.author.id,
            guildId: message.guild.id,
        });
        const modLogId = this.client.db.settings.selectModLogId
            .pluck()
            .get(message.guild.id);
        const modLog = message.guild.channels.cache.get(modLogId);
        if (
            modLog &&
            modLog.viewable &&
            modLog
                .permissionsFor(message.guild.members.me)
                .has(['SEND_MESSAGES', 'EMBED_LINKS'])
        ) {
            const caseNumber = await this.client.utils.getCaseNumber(
                this.client,
                message.guild,
                modLog
            );
            const embed = new EmbedBuilder()
                .setTitle(
                    `Action: \`${this.client.utils.capitalize(this.name)}\``
                )
                .addFields([{name: 'Moderator', value:  message.member.toString(), inline:  true}])
                .setFooter({text: `Case #${caseNumber}`})
                .setTimestamp()
                .setColor(message.guild.members.me.displayHexColor);
            for (const field in fields) {
                embed.addFields([{name: field, value:  fields[field], inline:  true}]);
            }
            embed.addFields([{name: 'Reason', value:  reason}]);
            modLog
                .send({embeds: [embed]})
                .catch((err) => this.client.logger.error(err.stack));
        }
    }

    /**
     * Creates an error embed
     * @param error
     * @returns {EmbedBuilder}
     */
    createErrorEmbed(error) {
        return new EmbedBuilder()
            .setTitle(this.name.toUpperCase())
            .setDescription(
                `${emojis.fail} ${error || 'An error has occurred'}
                    
                    **Usage**:
                    \`\`\`${this.usage}\`\`\`
                    **Example**:
                    \`\`\`${this.examples.join('\n')}\`\`\``
            )
            .setColor('Red');
    }

    /**
     * Send a payload as a reply to an interaction (reply must be deferred) or a message
     * @param context - Interaction or message context
     * @param payload - Payload to send
     * @returns {Promise<GuildCacheMessage<CacheType>>}
     */
    async sendReply(context, payload) {
        try {
            if (context.commandId) // If the context is an interaction
                return (await context.editReply(payload));
            else // If the context is a message
                return context.loadingMessage ? await context.loadingMessage.edit(payload) : await context.reply(payload);
        }
        catch (err) {
            this.client.logger.error(err.stack);
        }
    }

    /**
     * Send a payload as a reply to an interaction or a message, then delete the message
     * @param context - Interaction or message context
     * @param payload - Payload to send
     * @param timeout - Timeout in milliseconds to delete the message. Default is 5000
     */
    sendReplyAndDelete(context, payload, timeout = 10000) {
        this.sendReply(context, payload).then(m => setTimeout(() => m?.delete(), timeout));
    }
}

module.exports = Command;
