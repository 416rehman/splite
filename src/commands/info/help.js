const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

let disbut;
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
        })
        disbut = require('discord-buttons')(client);;
    }
    async run(message, args) {
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
            return message.channel.send(embed);
        } else if (args.length > 0 && !all) {
            return this.sendErrorMessage(message, 0, 'Unable to find command, please check provided command');

        } else
        {

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
            const allButtons = [];
            message.client.commands.forEach(command => {
                if (!disabledCommands.includes(command.name) && !command.name.startsWith('clear') && !command.name.startsWith('texthelp')) {
                    if (command.userPermissions && command.userPermissions.every(p => message.member.hasPermission(p)) && !all)
                        commands[command.type].push(`\`${command.name}\``);
                    else if (!command.userPermissions || all) {
                        commands[command.type].push(`\`${command.name}\``);
                    }
                }
            });

            commands[`Slash Commands`] = []
            commands[`Slash Commands`].push(`\`/anonymous\` Post anonymous message. **Cost: 50 points**\
      \n\`/confess\` Post a confession in confessions channel.\
      \n\`/report\` Report a confession.\
      \n${message.member.hasPermission('MANAGE_GUILD') ? `\`/view\` View details of a confession.` : ' '}`)

            for (const property in commands) {
                if (commands[property].length){

                    const button = new disbut.MessageButton().setLabel(`${capitalize(property)}`).setID(`${property.replace(/ /g, '_')}`).setStyle('blurple')
                    if (emojiMap[property])
                    {
                        const animated = emojiMap[property].match(/(?<=\<)(.*?)(?=\:)/)[1] || '';
                        const name = emojiMap[property].match(/(?<=\:)(.*?)(?=\:)/)[1]
                        const id = emojiMap[property].match(/(?<=\:)(.*?)(?=\>)/)[1].split(':')[1]
                        button.emoji = {name: name, id: id, animated: !!animated}
                    }

                    allButtons.push(button)
                }}
            const total = Object.values(commands).reduce((a, b) => a + b.length, 0) - commands[OWNER].length;
            const size = message.client.commands.size - commands[OWNER].length;

            embed // Build help embed
                .setTitle('Splite\'s Commands')
                .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **Command Information:** \`${prefix}help [command]\`
          ${(!all && size != total) ? `**All Commands:** \`${prefix}help all\`` : ''}\n
        `)
                .setFooter('Expires in 60 seconds.\n' + message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setThumbnail('https://i.imgur.com/B0XSinY.png')
                .setColor(message.guild.me.displayHexColor)
                .addField(
                    '**Links**',
                    '**[Invite Me](https://discord.com/api/oauth2/authorize?client_id=842244538248593439&permissions=4294438903&scope=bot%20applications.commands) | ' +
                    'Developed By Split#0420**')

            const chunks = 4 //tweak this to add more items per line
            let buttons = new Array(Math.ceil(allButtons.length / chunks))
                .fill()
                .map(_ => allButtons.splice(0, chunks));


            let msg = await message.channel.send({ buttons: buttons, embed: embed });

            const filter = (button) => button.clicker.user.id === message.author.id;
            const collector = msg.createButtonCollector(filter, { time: 60000 }); //collector for 5 seconds
            let tempEmbed = new MessageEmbed()
            collector.on('collect', b => {

                const type = `${b.id}`.replace(/_/g, ' ')
                tempEmbed.fields = []
                tempEmbed = tempEmbed.setTitle('Splite\'s Commands')
                    .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **Command Information:** \`${prefix}help [command]\`
          ${(!all && size != total) ? `**All Commands:** \`${prefix}help all\`` : ''}\n`)
                    .setFooter('Expires in 60 seconds \n' + message.member.displayName ,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setTimestamp()
                    .setThumbnail('https://i.imgur.com/B0XSinY.png')
                    .setColor("RANDOM")
                if (type === `Slash Commands`)
                    tempEmbed.addField(`${emojis.verified_developer} **/${type}**`, commands[type])
                else
                    tempEmbed.addField(`**${emojiMap[type]} [${commands[type].length}]**`, `${emojiMap[type].includes('Admin') ? 'Commands can be cleared by replacing "set" with "clear".\ni.e `setmodlog` ➔ `clearmodlog`\n-----------------------------------------------------\n' : ''} ${commands[type].join(', ')}`);

                buttons = buttons.map(row => {
                    row.forEach(button =>{
                        if (button.custom_id === b.id) button.style = 3;
                        else button.style = 1
                    })
                    return row
                })

                msg.edit({ buttons: buttons, embed: tempEmbed })
                b.defer()
            });
            collector.on('end', () => {
                tempEmbed.setFooter('Expired! For text-only help command, type \`${prefix}texthelp\` \n' + message.member.displayName ,
                    message.author.displayAvatarURL({ dynamic: true })
                )
                msg.edit({ buttons: [], embed: tempEmbed })
            });
        }
    }
};