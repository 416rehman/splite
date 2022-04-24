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
            .setAuthor(`${this.user.tag}`, this.user.displayAvatarURL({dynamic: true}))
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
        this.logger.info(`\n${table.toString()}`);
        return this;
    }

    //
    // /**
    //  * Loads all available slash commands
    //  * @param path
    //  */
    // loadSlashCommands(path) {
    //     this.logger.info(`Loading Slash Commands`)
    //     const table = new AsciiTable('Slash Commands').setHeading('Name', 'Type', 'Status');
    //
    //     const folders = readdirSync(path).filter(file => !file.endsWith('.js'))
    //
    //     folders.forEach(folder => {
    //         this.logger.info(`Folder: ${folder}`)
    //         const commands = readdirSync(resolve(__basedir, join(path, folder))).filter(f => f.endsWith('.js'))
    //         commands.forEach(f => {
    //             const Command = require(resolve(__basedir, join(path, folder, f)));
    //             const slashCommand = new Command(this);
    //
    //             if (slashCommand.name && !slashCommand.disabled && slashCommand) {
    //                 this.slashCommands.set(slashCommand.name, slashCommand);
    //                 table.addRow(f, slashCommand.type, 'Pass');
    //                 this.logger.info(`Loaded Slash Command: ${f} | ${slashCommand.description} | Type: ${slashCommand.type}`)
    //             } else {
    //                 table.addRow(f, '', 'Fail');
    //                 this.logger.error(`Failed Loading Command: ${f}`)
    //             }
    //         })
    //     })
    //     this.logger.info(table.toString())
    // }

    /**
     * Registers all slash commands across all the guilds
     * @param id client id
     * @returns {Promise<void>}
     */
    async registerAllSlashCommands(id) {
        this.logger.info('Started refreshing application (/) commands.');
        const data = this.commands.filter(c => c.slashCommand && c.disabled !== true).map(c => c.slashCommand.toJSON())
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
                await rest.put(
                    Routes.applicationGuildCommands(id, guild.id),
                    {body: commands},
                );
                resolve('Registered slash commands for ' + guild.name);
            } catch (error) {
                reject(error);
            }
        }))
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
}

module.exports = Client;
