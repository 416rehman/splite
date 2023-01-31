global.__basedir = __dirname;

const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const AsciiTable = require('ascii-table');
const {readdirSync} = require('fs');
const {resolve, join} = require('path');
const Discord = require('discord.js');
const {Statics} = require('./src/utils/utils');
const logger = require('./src/utils/logger');
const intents = require('./intents.js');

const config = Statics.config;

class CommandRegistrar extends Discord.Client {
    constructor() {
        super({
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            allowedMentions: {parse: ['users', 'roles'], repliedUser: true},
            intents: intents
        });
        this.utils = require('./src/utils/utils');
        this.intents = intents;
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
            OWNER: 'owner'
        };
        this.topics = {};
        this.disabledCommands = config.disabledCommands || [];
    }

    loadTopics(path, type) {
        this.logger.info(`Loading topics for ${type}...`);
        const files = readdirSync(path).filter(
            (f) => f.split('.').pop() === 'yaml'
        );

        if (files.length === 0) return this.logger.warn('No topics found');
        this.logger.info(`${files.length} topic(s) found...`);
        this.topics[type] = [];
        files.forEach((f) => {
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

        if (command.name && !command.disabled && !this.disabledCommands.includes(command.name)) {
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
     * Registers all slash commands across all the guilds
     * @returns {Promise<void>}
     */
    async registerAllSlashCommands() {
        const previous_commands = await this.application.commands.fetch();
        this.logger.info('Started refreshing application (/) commands.');
        const commandsToRegister = this.commands.filter(
            (c) =>
                c.slashCommand &&                       // Must have a slashCommand property
                !c.disabled &&                          // Must NOT be disabled
                !this.disabledCommands.includes(c.name) && // Must NOT be disabled
                c.type !== this.types.OWNER &&          // Must not be an OWNER command
                c.type !== this.types.MANAGER           // Must not be a MANAGER command
        );
        console.log(`Registering ${commandsToRegister.size} commands...`);

        const rest = new REST({version: '9'}).setToken(this.config.token);

        // BULK OVERWRITE GLOBAL APP COMMANDS
        // If the command was already registered, and a new command with matching name is provided, it will be UPDATED.
        // If the command was already registered, and NO new command with matching name is provided, it will be DELETED.
        // If the command was NOT already registered, it will be registed and will count towards daily command creation LIMIT.
        // More: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await (async () => {
            try {
                const registeredCommands = await rest.put(
                    Routes.applicationCommands(this.application.id),
                    {
                        body: commandsToRegister.map((c) => c.slashCommand.toJSON())
                    }
                );
                this.logger.info(`Successfully registered ${registeredCommands.length}/${commandsToRegister.size} application commands.`);

                const removedCommands = previous_commands.filter(pc => !registeredCommands.find(c => c.name === pc.name)).map(c => c.name);
                const newCommands = registeredCommands.filter(c => !previous_commands.find(pc => pc.name === c.name)).map(c => c.name);

                const allCommands = new Set([...this.commands.filter(c => c.slashCommand).map(c => c.slashCommand.name), ...previous_commands.map(c => c.name)]);

                console.log({
                    'Commands': [...allCommands].map(c => {
                        if (removedCommands.length && removedCommands.includes(c)) return '- ' + c;
                        if (newCommands.length && newCommands.includes(c)) return '+ ' + c;
                        return '= ' + c;
                    })
                });
                this.logger.info(`= App Commands Overwritten: ${(registeredCommands.length - newCommands.length)}`);
                this.logger.info(`+ New App Commands Registered: ${newCommands.length || 0}`);
                this.logger.info(`- Old App Commands Removed: ${removedCommands.length || 0}`);
            }
            catch (error) {
                this.logger.error(error);
            }
        })();

        // Register SUDO Commands
        const restrictedCommandsToRegister = this.commands.filter(
            (c) =>
                c.slashCommand &&   // Must have a slashCommand component
                !c.disabled &&      // Must not be disabled
                !this.disabledCommands.includes(c.name) && // Must not be disabled
                (c.type === this.types.OWNER || c.type === this.types.MANAGER)  // Must be either an OWNER or MANAGER command
        );

        const guild = this.guilds.cache.get(this.config.supportServerId);

        if (guild) {
            this.logger.info(`Registering ${restrictedCommandsToRegister.size} SUDO Commands in guild ${guild.id}(${guild.name}) `);
            try {
                const res = await rest.put(
                    Routes.applicationGuildCommands(this.application.id, guild.id),
                    {
                        body: restrictedCommandsToRegister.map((c) => c.slashCommand.toJSON())
                    }
                );
                this.logger.info(`Successfully registered ${res.length}/${restrictedCommandsToRegister.size} SUDO commands in guild ${guild.id}(${guild.name}).`);
            }
            catch (error) {
                this.logger.error(error);
            }
        }
        else {
            this.logger.error(`Guild ${this.config.supportServerId} not found - Skipping SUDO Command Registration`);
        }
    }
}

const instance = new CommandRegistrar();

instance.loadTopics('./data/trivia', 'trivia');
instance.loadCommands('./src/commands');

instance.login(instance.config.token).then(() => {
    instance.registerAllSlashCommands().then(() => {
        console.log('Completed');
        process.exit(0);
    });
});
