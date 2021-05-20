const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      aliases: ['commands', 'h'],
      usage: 'help [command | all]',
      description: oneLine`
        Displays a list of all current commands, sorted by category. 
        Can be used in conjunction with a command for additional information.
        Will only display commands that you have permission to access unless the \`all\` parameter is given.
      `,
      type: client.types.INFO,
      examples: ['help ping']
    });
  }
  run(message, args) {

    // Get disabled commands
    let disabledCommands = message.client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
    if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');

    const all = (args[0] === 'all') ? args[0] : '';
    const embed = new MessageEmbed();
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id); // Get prefix
    const { INFO, FUN, SMASHORPASS, NSFW, POINTS, MISC, MOD, ADMIN, OWNER } = message.client.types;
    const { capitalize } = message.client.utils;
    
    const command = message.client.commands.get(args[0]) || message.client.aliases.get(args[0]);
    if (
      command && 
      (command.type != OWNER || message.client.isOwner(message.member)) && 
      !disabledCommands.includes(command.name)
    ) {
      
      embed // Build specific command help embed
        .setTitle(`Command: \`${command.name}\``)
        .setThumbnail('https://i.imgur.com/B0XSinY.png')
        .setDescription(command.description)
        .addField('Usage', `\`${prefix}${command.usage}\``, true)
        .addField('Type', `\`${capitalize(command.type)}\``, true)
        .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
      if (command.aliases) embed.addField('Aliases', command.aliases.map(c => `\`${c}\``).join(' '));
      if (command.examples) embed.addField('Examples', command.examples.map(c => `\`${prefix}${c}\``).join('\n'));

    } else if (args.length > 0 && !all) {
      return this.sendErrorMessage(message, 0, 'Unable to find command, please check provided command');

    } else {

      // Get commands
      const commands = {};
      for (const type of Object.values(message.client.types)) {
        commands[type] = [];
      }

      const emojiMap = {
        [INFO]: `${emojis.info} ${capitalize(INFO)}`,
        [FUN]: `${emojis.fun} ${capitalize(FUN)}`,
        [SMASHORPASS]: `${emojis.smashorpass} ${capitalize(SMASHORPASS)}`,
        [NSFW]: `${emojis.nsfw} ${capitalize(NSFW)}`,
        [POINTS]: `${emojis.points} ${capitalize(POINTS)}`,
        [MISC]: `${emojis.misc} ${capitalize(MISC)}`,
        [MOD]: `${emojis.mod} ${capitalize(MOD)}`,
        [ADMIN]: `${emojis.admin} ${capitalize(ADMIN)}`,
        [OWNER]: `${emojis.owner} ${capitalize(OWNER)}`
      };

      message.client.commands.forEach(command => {
        if (!disabledCommands.includes(command.name) && !command.name.startsWith('clear')) {
          if (command.userPermissions && command.userPermissions.every(p => message.member.hasPermission(p)) && !all)
            commands[command.type].push(`\`${command.name}\``);
          else if (!command.userPermissions || all) {
              commands[command.type].push(`\`${command.name}\``);
          }
        }
      });

      const total = Object.values(commands).reduce((a, b) => a + b.length, 0) - commands[OWNER].length;
      const size = message.client.commands.size - commands[OWNER].length;

      embed // Build help embed
        .setTitle('Splite\'s Commands')
        .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **Command Information:** \`${prefix}help [command]\`
          ${(!all && size != total) ? `**All Commands:** \`${prefix}help all\`` : ''}\n
        `)
        .setFooter(
          (!all && size != total) ? 
            'Only showing available commands.\n' + message.member.displayName : message.member.displayName, 
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/B0XSinY.png')
        .setColor(message.guild.me.displayHexColor);

      for (const type of Object.values(message.client.types)) {
        if (type === OWNER && !message.client.isOwner(message.member)) continue;
        if (commands[type][0])
        {
          embed.addField(`**${emojiMap[type]} [${commands[type].length}]**`, `${emojiMap[type].includes('Admin') ? 'Commands can be cleared by replacing "set" with "clear". i.e `setmodlog` ➔ `clearmodlog`\n-----------------------------------------------------\n' : ''} ${commands[type].join(', ')}`);
        }

      }

      let viewHelp = ''
      if (message.member.hasPermission('MANAGE_GUILD')) viewHelp = `\`/view\` View details of a confession.`
      embed.addField(`${emojis.verified_developer} **/Slash Commands**`, `\`/anonymous\` Post anonymous message. **Cost: 50 points**\
      \n\`/confess\` Post a confession in confessions channel.\
      \n\`/report\` Report a confession.\
      \n${viewHelp}`)

      embed.addField(
          '**Links**',
          '**[Invite Me](https://discord.com/api/oauth2/authorize?client_id=842244538248593439&permissions=4294438903&scope=bot%20applications.commands) | ' +
          'Developed By Split#0420**')
    }
    message.channel.send(embed);
  }
};