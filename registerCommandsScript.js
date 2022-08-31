global.__basedir = __dirname;

const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const AsciiTable = require('ascii-table');
const {readdir, readdirSync} = require('fs');
const {resolve, join} = require('path');
const Discord = require('discord.js');
const config = require('./config.json');
const logger = require('./src/utils/logger');
const {enabledIntents} = require('./intents.js');
const {allIntents} = require('./intents');

class CommandRegistrar extends Discord.Client {
    constructor() {
        super({
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            allowedMentions: {parse: ['users', 'roles'], repliedUser: true},
            intents: enabledIntents,
        });
        this.utils = require('./src/utils/utils');
        this.enabledIntents = enabledIntents;
        this.intents = allIntents;
        this.config = config;
        this.logger = logger;
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
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
        this.topics = {};
    }


    loadTopics(path, type) {
        this.logger.info(`Loading topics for ${type}...`);
        const files = readdirSync(path).filter(f => f.split('.').pop() === 'yaml');

        if (files.length === 0) return this.logger.warn('No topics found');
        this.logger.info(`${files.length} topic(s) found...`);
        this.topics[type] = [];
        files.forEach(f => {
            const topic = f.substring(0, f.indexOf('.'));
            this.topics[type].push(topic);
            this.logger.info(`Loading topic: ${topic}`);
        });
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
                }
                else {
                    this.logger.warn(`${f} failed to load`);
                    table.addRow(f, '', '', 'fail');
                }
            });
        });
        this.logger.info(`\n${table.toString()}`);
        return this;
    }

    /**
     * Registers all slash commands across all the guilds
     * @returns {Promise<void>}
     */
    async registerAllSlashCommands() {
        this.logger.info('Started refreshing application (/) commands.');
        const data = this.commands.filter(c => c.slashCommand && !c.disabled && c.type !== this.types.OWNER && c.type !== this.types.MANAGER);
        console.log({data: data.size});
        const restrictedData = this.commands.filter((c) => c.slashCommand && !c.disabled && (c.type === this.types.OWNER || c.type === this.types.MANAGER));

        const rest = new REST({version: '9'}).setToken(this.config.token);

        // Register Application Commands
        await (async () => {
            try {
                await rest.put(Routes.applicationCommands(this.application.id), {
                    body: data.map(c => c.slashCommand.toJSON()),
                });
            }
            catch (error) {
                console.error(error);
            }

            // Remove Non-Existent Application Commands
            this.application.commands.fetch().then((registeredCommands) => {
                registeredCommands.filter(c => c.applicationId === this.application.id).forEach(async c => {
                    if (!data.find(d => d.slashCommand.name === c.name)) {
                        await rest.delete(Routes.applicationCommand(this.application.id, c.id));
                        console.log(`Deleted ${c.name} from application as it no longer exists.`);
                    }
                });
            });
        })();

        // Register SUDO Commands
        const guild = this.guilds.cache.get(this.config.supportServerId);
        if (guild) {
            console.log(`Registering ${restrictedData.size} SUDO Commands in ` + guild.name);
            try {
                await rest.put(Routes.applicationGuildCommands(this.application.id, guild.id), {
                    body: restrictedData.map(c => c.slashCommand.toJSON())
                });
                // Remove Non-Existent SUDO Commands
                guild.commands.fetch().then((registeredCommands) => {
                    registeredCommands.filter(c => c.applicationId === this.application.id).forEach(async c => {
                        if (!restrictedData.find(sc => sc.slashCommand.name === c.name)) {
                            await rest.delete(Routes.applicationGuildCommand(this.application.id, guild.id, c.id));
                            console.log(`Deleted ${c.name} from application as it no longer exists.`);
                        }
                    });

                    this.logger.info('Registered SUDO slash commands for ' + guild.name + ' ' + guild.id);
                });
            }
            catch (error) {
                console.error(error);
            }
        }
    }
}

const instance = new CommandRegistrar();

instance.loadTopics('./data/trivia', 'trivia');
instance.loadCommands('./src/commands');

instance.login(instance.config.token).then(() => {
    instance.registerAllSlashCommands();
});
