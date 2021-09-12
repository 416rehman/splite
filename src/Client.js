const Discord = require('discord.js');
const { readdir, readdirSync } = require('fs');
const { join, resolve } = require('path');
const AsciiTable = require('ascii-table');
const { fail } = require('./utils/emojis.json');
const amethyste = require('amethyste-api')
const { NekoBot } = require("nekobot-api");

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
    this.bugReportChannelId = config.bugReportChannelId;
    this.feedbackChannelId = config.feedbackChannelId;
    this.serverLogId = config.serverLogId;
    this.confessionReportsID = config.confessionReportsID
    this.utils = require('./utils/utils.js');
    this.logger.info('Initializing...');
    this.odds = new Map()
    this.votes = new Map()
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
   * Loads all available commands
   * @param {string} path 
   */
  loadCommands(path) {
    this.logger.info('Loading commands...');
    let table = new AsciiTable('Commands');
    table.setHeading('File', 'Aliases', 'Type', 'Status');
    readdirSync(path).filter( f => !f.endsWith('.js')).forEach( dir => {
      const commands = readdirSync(resolve(__basedir, join(path, dir))).filter(f => f.endsWith('js'));
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
          return;
        }
      });
    });
    this.logger.info(`\n${table.toString()}`);
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
    return user.id === this.ownerId;
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
      .setAuthor(`${this.user.tag}`, this.user.displayAvatarURL({ dynamic: true }))
      .setTitle(`${fail} System Error: \`${error}\``)
      .setDescription(`\`\`\`diff\n- System Failure\n+ ${errorMessage}\`\`\``)
      .setTimestamp()
      .setColor("RANDOM");
    systemChannel.send({embeds: [embed]});
  }
}

module.exports = Client;