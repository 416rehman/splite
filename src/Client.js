const Discord = require('discord.js');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {readdir, readdirSync} = require('fs');
const {join, resolve} = require('path');
const AsciiTable = require('ascii-table');
const {fail} = require('./utils/emojis.json');
const amethyste = require('amethyste-api')
const {Collection} = require("discord.js");
const {NekoBot} = require("nekobot-api");
const {Player} = require('discord-player');

class Client extends Discord.Client {
    constructor(config, options) {
        super(options);

        this.name = config.botName;
        this.config = config;
        this.link = config.inviteLink;
        this.ownerTag = config.ownerDiscordTag;
        this.logger = require('./utils/logger.js');
        this.db = require('./utils/db.js');
        this.types = {
            INFO: 'info',
            FUN: 'fun',
            POINTS: 'points',
            SMASHORPASS: 'Smash or Pass',
            NSFW: 'NSFW 18+',
            MISC: 'misc',
            MOD: 'mod',
            MUSIC: 'music',
            ADMIN: 'admin',
            OWNER: 'owner',
        };
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
        this.webhooks = new Discord.Collection();
        this.topics = [];
        this.token = config.token;
        this.apiKeys = config.apiKeys;
        this.ameApi = new amethyste(config.apiKeys.amethyste)
        this.nekoApi = new NekoBot()
        this.ownerId = config.ownerId;
        this.extraOwnerIds = config.extraOwnerIds
        this.bugReportChannelId = config.bugReportChannelId;
        this.feedbackChannelId = config.feedbackChannelId;
        this.serverLogId = config.serverLogId;
        this.confessionReportsID = config.confessionReportsID
        this.utils = require('./utils/utils.js');
        this.logger.info('Initializing...');
        this.odds = new Map();
        this.votes = new Map();
        this.slashCommands = new Collection();

        //Create a new music player instance
        this.player = new Player(this, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        })
    }

    /**
     * Loads all available events
     * @param {string} path
     */
    loadEvents(path) {
        readdir(path, (err, files) => {
            if (err) this.logger.error(err);
            files = files.filter(f => f.split('.').pop() === 'js');
            if (files.length === 0) return this.logger.warn('No events found');
            this.logger.info(`${files.length} event(s) found...`);
            files.forEach(f => {
                const eventName = f.substring(0, f.indexOf('.'));
                const event = require(resolve(__basedir, join(path, f)));
                super.on(eventName, event.bind(null, this));
                delete require.cache[require.resolve(resolve(__basedir, join(path, f)))]; // Clear cache
                this.logger.info(`Loading event: ${eventName}`);
            });
        });
        return this;
    }

    /**
     * Loads all available geoGuessr topics
     * @param {string} path
     */
    loadTopics(path) {
        readdir(path, (err, files) => {
            if (err) this.logger.error(err);
            files = files.filter(f => f.split('.').pop() === 'yml');
            if (files.length === 0) return this.logger.warn('No topics found');
            this.logger.info(`${files.length} topic(s) found...`);
            files.forEach(f => {
                const topic = f.substring(0, f.indexOf('.'));
                this.topics.push(topic);
                this.logger.info(`Loading topic: ${topic}`);
            });
        });
        return this;
    }

    /**
     * Checks if user is the bot owner
     * @param {User} user
     */
    isOwner(user) {
        return user.id === this.ownerId || this.extraOwnerIds?.includes(user.id)
    }

    /**
     * Creates and sends system failure embed
     * @param {Guild} guild
     * @param {string} error
     * @param {string} errorMessage
     */
    sendSystemErrorMessage(guild, error, errorMessage) {

        // Get system channel
        const systemChannelId = this.db.settings.selectSystemChannelId.pluck().get(guild.id);
        const systemChannel = guild.channels.cache.get(systemChannelId);

        if ( // Check channel and permissions
            !systemChannel ||
            !systemChannel.viewable ||
            !systemChannel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
        ) return;

        const embed = new Discord.MessageEmbed()
            .setAuthor({
                name: `${this.user.tag}`,
                iconURL: this.user.displayAvatarURL({format: 'png', dynamic: true})
            })
            .setTitle(`${fail} System Error: \`${error}\``)
            .setDescription(`\`\`\`diff\n- System Failure\n+ ${errorMessage}\`\`\``)
            .setTimestamp()
            .setColor("RANDOM");
        systemChannel.send({embeds: [embed]});
    }


    /**
     * Loads all available commands
     * @param {string} path
     */
    loadCommands(path) {
        this.logger.info('Loading commands...');
        let table = new AsciiTable('Commands');
        table.setHeading('File', 'Aliases', 'Type', 'Status');

        readdirSync(path).filter(f => !f.endsWith('.js')).forEach(dir => {
            const commands = readdirSync(resolve(__basedir, join(path, dir))).filter(file => file.endsWith('js'));

            commands.forEach(f => {
                const Command = require(resolve(__basedir, join(path, dir, f)));
                const command = new Command(this); // Instantiate the specific command
                if (command.name && !command.disabled) {
                    // Map command
                    this.commands.set(command.name, command);

                    // Map command aliases
                    let aliases = '';
                    if (command.aliases) {
                        command.aliases.forEach(alias => {
                            this.aliases.set(alias, command);
                        });
                        aliases = command.aliases.join(', ');
                    }


                    table.addRow(f, aliases, command.type, 'pass');
                } else {
                    this.logger.warn(`${f} failed to load`);
                    table.addRow(f, '', '', 'fail');
                }
            });
        });
        // this.logger.info(`\n${table.toString()}`);
        return this;
    }

    loadWebhooks(path) {
        this.logger.info('Loading webhooks...');
        let table = new AsciiTable('Webhooks');
        table.setHeading('Endpoint', 'Description', 'Status');


        const webhooks = readdirSync(path).filter(file => file.endsWith('.webhook.js'));
        console.log("WEBHOOKS: ", webhooks);
        console.log({webhooks});

        webhooks.forEach(f => {
            const Webhook = require(resolve(__basedir, join(path, f)));
            const webhook = new Webhook(this); // Instantiate the specific command
            if (webhook.name && !webhook.disabled) {
                // Map command
                this.webhooks.set(webhook.name, webhook);

                table.addRow(`/${webhook.name}`, webhook.description || '', 'pass');
            } else {
                this.logger.warn(`${f} failed to load`);
                table.addRow(`/${webhook.name}`, webhook.description || '', 'fail');
            }
        });
        this.logger.info(`\n${table.toString()}`);
        return this;
    }


    /**
     * Registers all slash commands across all the guilds
     * @param id client id
     * @returns {Promise<void>}
     */
    async registerAllSlashCommands(id) {
        this.logger.info('Started refreshing application (/) commands.');
        const data = this.commands.filter(c => c.slashCommand && c.disabled !== true);
        const promises = [];
        this.guilds.cache.forEach(g => {
            promises.push(this.registerSlashCommands(g, data, id))
        })
        Promise.all(promises).then(() => {
            this.logger.info('Finished refreshing application (/) commands.');
        }).catch((error) => {
            const guild = error.url.toString().match(/(guilds\/)(\S*)(\/commands)/)[2]
            if (error.code === 50001) return this.logger.error(`Failed to setup slash commands for guild: ${guild}. Missing perms.`)
        })
    }

    /**
     * Registes all slash commands in the provided guild
     * @param guild guild to register commands in
     * @param commands array of commands
     * @param id client id
     * @returns {Promise<unknown>}
     */
    registerSlashCommands(guild, commands, id) {
        return new Promise((async (resolve, reject) => {

            const rest = new REST({version: '9'}).setToken(this.token);
            try {
                const slashCommands = commands.map(c => {
                    if (c.userPermissions && c.userPermissions.length > 0)
                        c.slashCommand.setDefaultPermission(false);

                    return c.slashCommand.toJSON();
                })
                await rest.put(
                    Routes.applicationGuildCommands(id, guild.id),
                    {body: slashCommands},
                );

                guild.commands.fetch().then(async (registeredCommands) => {
                    let fullPermissions = registeredCommands.map(async c => this.constructFullPermissions(commands, c, guild))

                    Promise.all(fullPermissions).then(async (permissions) => {
                        permissions = permissions.filter(p => p !== undefined && p !== null) // filter out undefined and null values
                        guild.commands?.permissions.set({fullPermissions: permissions})
                        console.log(`Updated command permissions for ${guild.name}`)
                    })
                })

                resolve('Registered slash commands for ' + guild.name);

            } catch (error) {
                reject(error);
            }
        }))
    }

    /**
     * Constructs the full permissions object for a slash command
     * @param allCommands
     * @param slashCommand
     * @param guild
     * @return {{permissions: *, id}|null}
     */
    constructFullPermissions(allCommands, slashCommand, guild) {
        const perms_required = allCommands.find(command => command.name === slashCommand.name).userPermissions;
        if (!perms_required || perms_required.length === 0) return;

        let matching_roles = guild.roles.cache.filter(r => r.permissions.has(perms_required))
        if (!matching_roles || matching_roles.length === 0) return null;

        return {
            id: slashCommand.id,
            permissions: matching_roles.last(10).map(r => {
                return {
                    id: r.id,
                    type: 'ROLE',
                    permission: true
                }
            })
        }
    }

    /**
     * Music Events Handler
     */
    handleMusicEvents() {
        this.player.on('error', (queue, error) => {
            console.log(`Error emitted from the queue ${error.message}`);
        });

        this.player.on('connectionError', (queue, error) => {
            console.log(`Error emitted from the connection ${error.message}`);
        });

        this.player.on('trackStart', (queue, track) => {
            if (!this.config.music.loopMessage && queue.repeatMode !== 0) return;
            queue.metadata.send(`Started playing ${track.title} in **${queue.connection.channel.name}** 🎧`);
        });

        this.player.on('trackAdd', (queue, track) => {
            queue.metadata.send(`Track ${track.title} added in the queue ✅`);
        });

        this.player.on('botDisconnect', (queue) => {
            queue.metadata.send('I was manually disconnected from the voice channel, clearing queue... ❌');
        });

        this.player.on('channelEmpty', (queue) => {
            queue.metadata.send('Nobody is in the voice channel, leaving the voice channel... ❌');
        });
    }

    /**
     * Loads the Guild from the client to the database
     * @param guild The guild to load
     * @param prune if true, checks for members that are not in the guild and removes them, and checks for members that are not in the database and adds them
     * @param createSettings if true, creates the settings for the guild, otherwise it will just load the settings
     */
    async loadGuild(guild, prune = true, createSettings = false) {
        let {modLog, adminRole, modRole, muteRole, crownRole} = await this.extractSettings(guild, createSettings);

        /** ------------------------------------------------------------------------------------------------
         * UPDATE TABLES
         * ------------------------------------------------------------------------------------------------ */
        // Update settings table
        this.db.settings.insertRow.run(
            guild.id,
            guild.name,
            guild.systemChannelID, // Default channel
            null, //confessions_channel_id
            guild.systemChannelID, // Welcome channel
            guild.systemChannelID, // Farewell channel
            guild.systemChannelID,  // Crown Channel
            modLog ? modLog.id : null,
            adminRole ? adminRole.id : null,
            modRole ? modRole.id : null,
            muteRole ? muteRole.id : null,
            crownRole ? crownRole.id : null,
            null, //joinvoting_message_id
            null,  //joinvoting_emoji
            null,  //voting_channel_id
            0,     //anonymous
            null      //view_confessions_role
        );

        /** ------------------------------------------------------------------------------------------------
         * Force Cache all members
         * ------------------------------------------------------------------------------------------------ */
        guild.members.fetch().then(members => {
            const toBeInserted = members.map(member => {
                // Update bios table
                this.db.bios.insertRow.run(member.id, null)
                return {
                    user_id: member.id,
                    user_name: member.user.username,
                    user_discriminator: member.user.discriminator,
                    guild_id: guild.id,
                    guild_name: guild.name,
                    date_joined: member.joinedAt.toString(),
                    bot: member.user.bot ? 1 : 0,
                    afk: null, //AFK
                    afk_time: 0,
                    optOutSmashOrPass: 0
                }
            })

            // break up into chunks of 100 members using splice
            const chunks = [];
            while (toBeInserted.length > 0) {
                chunks.push(toBeInserted.splice(0, 100));
            }

            chunks.forEach(chunk => {
                this.db.users.insertBatch(chunk);
            })

            if (prune) {
                /** ------------------------------------------------------------------------------------------------
                 * CHECK DATABASE
                 * ------------------------------------------------------------------------------------------------ */
                    // If member left the guild, set their status to left
                const currentMemberIds = this.db.users.selectCurrentMembers.all(guild.id).map(row => row.user_id);
                for (const id of currentMemberIds) {
                    if (!guild.members.cache.has(id)) {
                        this.db.users.updateCurrentMember.run(0, id, guild.id);
                        this.db.users.wipeTotalPoints.run(id, guild.id);
                    }
                }

                // If member joined the guild, add to database
                const missingMemberIds = this.db.users.selectMissingMembers.all(guild.id).map(row => row.user_id);
                for (const id of missingMemberIds) {
                    if (guild.members.cache.has(id)) this.db.users.updateCurrentMember.run(1, id, guild.id);
                }
            }
        })

        await guild.members.cache.get(this.user.id).setNickname(`[${this.db.settings.selectPrefix.pluck().get(guild.id)}] ${this.name}`);
    }

    async extractSettings(guild, createSettings) {
        /** ------------------------------------------------------------------------------------------------
         * FIND SETTINGS
         * ------------------------------------------------------------------------------------------------ */
            // Find mod log
        const modLog = guild.channels.cache.find(c => c.name.replace('-', '').replace('s', '') === 'modlog' ||
                c.name.replace('-', '').replace('s', '') === 'moderatorlog');

        // Find admin and mod roles
        const adminRole =
            guild.roles.cache.find(r => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator');
        const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'mod' || r.name.toLowerCase() === 'moderator');
        let muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (createSettings && !muteRole) {
            try {
                muteRole = await guild.roles.create({
                    name: 'Muted',
                    permissions: []
                });
            } catch (err) {
                client.logger.error(err.message);
            }

            for (const channel of guild.channels.cache.values()) {
                try {
                    if (channel.viewable && channel.permissionsFor(guild.me).has('MANAGE_ROLES')) {
                        if (channel.type === 'GUILD_TEXT') // Deny permissions in text channels
                            await channel.permissionOverwrites.edit(muteRole, {
                                'SEND_MESSAGES': false,
                                'ADD_REACTIONS': false
                            });
                        else if (channel.type === 'GUILD_VOICE' && channel.editable) // Deny permissions in voice channels
                            await channel.permissionOverwrites.edit(muteRole, {
                                'SPEAK': false,
                                'STREAM': false
                            });
                    }
                } catch (err) {
                    client.logger.error(err.stack)
                }
            }
        }
        // Create crown role
        let crownRole = guild.roles.cache.find(r => r.name === 'The Crown');
        if (createSettings && !crownRole) {
            try {
                crownRole = await guild.roles.create({
                    name: 'The Crown',
                    permissions: [],
                    hoist: true
                });
            } catch (err) {
                client.logger.error(err.message);
            }
        }
        return {modLog, adminRole, modRole, muteRole, crownRole};
    }
}

module.exports = Client;
