const Discord = require('discord.js');
const {readdir, readdirSync} = require('fs');
const {join, resolve} = require('path');
const AsciiTable = require('ascii-table');
const {fail, online} = require('./utils/emojis.json');
const amethyste = require('amethyste-api');
const {Collection, ChannelType} = require('discord.js');
const {NekoBot} = require('nekobot-api');
const {Player} = require('discord-player');
const intents = require('../intents.js');
const {Configuration, OpenAIApi} = require('openai');
const moment = require('moment');

class Client extends Discord.Client {
    constructor(config, options) {
        super({...options, intents: intents,});
        this.intents = intents;
        this.config = config;
        this.name = config.botName;
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
            MANAGER: 'manager',
            OWNER: 'owner',
        };
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
        this.topics = {};
        this.ameApi = config?.apiKeys?.amethyste ? new amethyste(config.apiKeys.amethyste) : null;
        this.nekoApi = new NekoBot();
        this.supportServerId = config.supportServerId;
        this.utils = require('./utils/utils.js');
        this.logger.info('Initializing...');
        this.odds = new Map();
        this.votes = new Map();
        this.slashCommands = new Collection();
        this.owners = [];
        this.managers = [];

        //Create a new music player instance
        this.player = new Player(this, {
            ytdlOptions: {
                quality: 'highestaudio', highWaterMark: 1 << 25
            }
        });

        if (config.apiKeys?.openAI?.apiKey) {
            this.openai = new OpenAIApi(new Configuration({
                apiKey: config.apiKeys.openAI.apiKey,
            }));
        }
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
     * @param type - The type of topic to load
     */
    loadTopics(path, type) {
        readdir(path, (err, files) => {
            if (err) this.logger.error(err);
            files = files.filter(f => f.split('.').pop() === 'yaml');
            if (files.length === 0) return this.logger.warn('No topics found');
            this.logger.info(`${files.length} topic(s) found...`);
            this.topics[type] = [];
            files.forEach(f => {
                const topic = f.substring(0, f.indexOf('.'));
                this.topics[type].push(topic);
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
        return this.config.owners.includes(user.id);
    }

    /**
     * Checks if user is a bot manager
     * @param user
     * @return {*}
     */
    isManager(user) {
        return this.config.managers.includes(user.id) || this.isOwner(user);
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
            !systemChannel || !systemChannel.viewable || !systemChannel.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks'])) return;

        const embed = new Discord.EmbedBuilder()
            .setAuthor({
                name: `${this.user.tag}`, iconURL: this.getAvatarURL(this.user)
            })
            .setTitle(`${fail} System Error: \`${error}\``)
            .setDescription(`\`\`\`diff\n- System Failure\n+ ${errorMessage}\`\`\``)
            .setTimestamp();
        systemChannel.send({embeds: [embed]});
    }

    removeAFK(member, guild, channel) {
        let afkStatus = this.db.users.selectAfk.get(guild.id, member.id);

        if (afkStatus?.afk != null) {
            const d = new Date(afkStatus.afk_time);
            this.db.users.updateAfk.run(null, 0, member.id, guild.id);

            if (member.nickname) {
                member.setNickname(`${member.nickname.replace('[AFK]', '')}`)
                    .catch(() => {
                        console.log('There was an error while trying to remove the AFK tag from the nickname: ' + member.tag);
                    });
            }
            channel
                .send(`${online} Welcome back ${member}, you went afk **${moment(d).fromNow()}**!`)
                .then((msg) => {
                    setTimeout(() => msg.delete(), 5000);
                });
        }
    }


    /**
     * Loads all available commands
     * @param {string} path
     */
    loadCommands(path) {
        this.logger.info('Loading commands...');
        let table = new AsciiTable('Commands');
        table.setHeading('File', 'Aliases', 'Type', 'Status');

        // sort it so that files with the word "group" are loaded at the end
        const groups = [];

        readdirSync(path).filter(f => !f.endsWith('.js')).forEach(dir => {
            const commands = readdirSync(resolve(__basedir, join(path, dir))).filter(file => file.endsWith('js'));
            commands.forEach(f => {
                if (f.toLowerCase().includes('group')) groups.push(resolve(__basedir, join(path, dir, f)));
                else this.tryLoadCommand(resolve(__basedir, join(path, dir, f)), table);
            });
        });

        groups.forEach(f => {
            this.tryLoadCommand(f, table);
        });

        this.logger.info(`\n${table.toString()}`);
        return this;
    }

    tryLoadCommand(filepath, table) {
        const Command = require(filepath);
        const command = new Command(this);

        const filename = filepath.split('/').pop().split('\\').pop();
        if (filename.toLowerCase().includes('group') && !command.name.toLowerCase().includes('group')) {
            this.logger.error(`Command Group files must have the word "group" in their filename and command name: ${filename}`);
            this.logger.error(`Make sure the command file ${filename} has the word "group" in its name property`);
            process.exit(1);
        }

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


            table.addRow(filename, aliases, command.type, 'pass');
        }
        else {
            this.logger.warn(`${filename} failed to load`);
            table.addRow(filename, '', '', 'fail');
        }
    }

    /**
     * Music Events Handler
     */
    handleMusicEvents() {
        this.player.on('error', (queue, error) => {
            this.logger.error(`Error emitted from the queue ${error.message}`);
        });

        this.player.on('connectionError', (queue, error) => {
            this.logger.error(`Error emitted from the connection ${error.message}`);
        });

        this.player.on('trackStart', (queue, track) => {
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
        this.db.settings.insertRow.run(guild.id, guild.name, guild.systemChannelID, // Default channel
            null, //confessions_channel_id
            guild.systemChannelID, // Welcome channel
            guild.systemChannelID, // Farewell channel
            guild.systemChannelID,  // Crown Channel
            modLog ? modLog.id : null, adminRole ? adminRole.id : null, modRole ? modRole.id : null, muteRole ? muteRole.id : null, crownRole ? crownRole.id : null, null, //joinvoting_message_id
            null,  //joinvoting_emoji
            null,  //voting_channel_id
            0,     //anonymous
            null      //view_confessions_role
        );
        /** ------------------------------------------------------------------------------------------------
         * Force Cache all members
         * ------------------------------------------------------------------------------------------------ */
        guild.members.fetch().then(async members => {
            const toBeInserted = members.map(member => {
                // Update bios table
                this.db.bios.insertRow.run(member.id, null);
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
                };
            });

            // break up into chunks of 100 members using splice
            const chunks = [];
            while (toBeInserted.length > 0) {
                chunks.push(toBeInserted.splice(0, 100));
            }

            chunks.forEach(chunk => {
                this.db.users.insertBatch(chunk);
            });

            if (prune) {
                const guildMembers = await guild.members.fetch();
                /** ------------------------------------------------------------------------------------------------
                 * CHECK DATABASE
                 * ------------------------------------------------------------------------------------------------ */
                // If member left the guild, set their status to left
                const currentMemberIds = this.db.users.selectCurrentMembers.all(guild.id).map(row => row.user_id);
                for (const id of currentMemberIds) {
                    if (!guildMembers.has(id)) {
                        this.db.users.updateCurrentMember.run(0, id, guild.id);
                        this.db.users.wipeTotalPoints.run(id, guild.id);
                    }
                }

                // If member joined the guild, add to database
                const missingMemberIds = this.db.users.selectMissingMembers.all(guild.id).map(row => row.user_id);
                for (const id of missingMemberIds) {
                    if (guildMembers.has(id)) this.db.users.updateCurrentMember.run(1, id, guild.id);
                }
            }
        });

        // Set Nickname to include prefix
        // await (await guild.members.fetch(this.user.id)).setNickname(`[${this.db.settings.selectPrefix.pluck().get(guild.id)}] ${this.name}`);
    }

    async extractSettings(guild, createSettings) {
        /** ------------------------------------------------------------------------------------------------
         * FIND SETTINGS
         * ------------------------------------------------------------------------------------------------ */
        // Find mod log
        const modLog = guild.channels.cache.find(c => c.name.replace('-', '').replace('s', '') === 'modlog' || c.name.replace('-', '').replace('s', '') === 'moderatorlog');

        // Find admin and mod roles
        const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator');
        const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'mod' || r.name.toLowerCase() === 'moderator');
        let muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (createSettings && !muteRole) {
            try {
                muteRole = await guild.roles.create({
                    name: 'Muted', permissions: []
                });
            }
            catch (err) {
                this.logger.error(err.message);
            }

            for (const channel of guild.channels.cache.values()) {
                try {
                    if (channel.viewable && channel.permissionsFor(guild.members.me).has('ManageRoles')) {
                        if (channel.type === ChannelType.GuildText) // Deny permissions in text channels
                            await channel.permissionOverwrites.edit(muteRole, {
                                'SendMessages': false, 'AddReactions': false
                            }); else if (channel.type === ChannelType.GuildVoice && channel.manageable) // Deny permissions in voice channels
                            await channel.permissionOverwrites.edit(muteRole, {
                                'Speak': false, 'Stream': false
                            });
                    }
                }
                catch (err) {
                    this.logger.error(err.stack);
                }
            }
        }
        // Create crown role
        let crownRole = guild.roles.cache.find(r => r.name === 'The Crown');
        if (createSettings && !crownRole) {
            try {
                crownRole = await guild.roles.create({
                    name: 'The Crown', permissions: [], hoist: true
                });
            }
            catch (err) {
                this.logger.error(err.message);
            }
        }
        return {modLog, adminRole, modRole, muteRole, crownRole};
    }

    getOwnerFromId(id) {
        return this.owners?.includes(id);
    }

    getManagerFromId(id) {
        return this.managers?.includes(id);
    }
}

module.exports = Client;
