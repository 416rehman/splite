const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const emojis = require('../../../utils/emojis.json');
const {MessageActionRow} = require("discord.js");
const {MessageButton} = require("discord.js");
const { oneLine, stripIndent } = require('common-tags');
module.exports = class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            aliases: ['commands', 'h', 'support'],
            usage: 'help [command | all]',
            description: oneLine`
        Displays a list of all current commands, sorted by category. 
        Can be used in conjunction with a command for additional information.
        Will only display commands that you have permission to access unless the \`all\` parameter is given.
      `,
            type: client.types.INFO,
            examples: ['help ping']
        })
    }
    async run(message, args) {
        // Get disabled commands
        let disabledCommands = message.client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
        if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');

        const all = (args[0] === 'all') ? args[0] : '';
        const embed = new MessageEmbed();
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id); // Get prefix
        const { INFO, FUN, POINTS, SMASHORPASS, NSFW, MISC, MOD, MUSIC, ADMIN, OWNER } = message.client.types;
        const { capitalize } = message.client.utils;

        const command = message.client.commands.get(args[0]) || message.client.aliases.get(args[0]);
        if ( command && (command.type != OWNER || message.client.isOwner(message.member)) && !disabledCommands.includes(command.name) ) {
            embed // Build specific command help embed
                .setTitle(`Command: \`${command.name}\``)
                .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
                .setDescription(command.description)
                .addField('Usage', `\`${prefix}${command.usage}\``, true)
                .addField('Type', `\`${capitalize(command.type)}\``, true)
                .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            if (command.aliases) embed.addField('Aliases', command.aliases.map(c => `\`${c}\``).join(' '));
            if (command.examples) embed.addField('Examples', command.examples.map(c => `\`${prefix}${c}\``).join('\n'));
            return message.channel.send({embeds: [embed]});
        }
        else if (args.length > 0 && !all) {
            return this.sendErrorMessage(message, 0, 'Unable to find command, please check provided command');
        }
        else {
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
                [MUSIC]: `${emojis.music} ${capitalize(MUSIC)}`,
                [ADMIN]: `${emojis.admin} ${capitalize(ADMIN)}`,
                [OWNER]: `${emojis.owner} ${capitalize(OWNER)}`
            };


            message.client.commands.forEach(command => {
                if (!disabledCommands.includes(command.name) && !command.name.startsWith('clear') && !command.name.startsWith('texthelp')) {
                    if (command.ownerOnly && !message.client.isOwner(message.member)) return

                    if (command.userPermissions && command.userPermissions.every(p => message.member.permissions.has(p)) && !all)
                        commands[command.type].push(`\`${command.name}\``);
                    else if (!command.userPermissions || all)
                        commands[command.type].push(`\`${command.name}\``);
                }
            });

            commands[`Slash Only Commands`] = message.client.slashCommands.map(s=>{
                if (s.name === 'view') {
                    if (message.member.permissions.has('MANAGE_GUILD'))
                        return `\`${s.name}\` ${s.description}`
                }
                else return `\`${s.name}\` ${s.description}`
            })
            commands[`Slash Only Commands`] = commands[`Slash Only Commands`].join('\n')

            const allButtons = [];
            for (const property in commands) {
                if (commands[property].length){

                    const button = new MessageButton().setCustomId(`${property.replace(/ /g, '_')}`).setLabel(`${capitalize(property)}`).setStyle('PRIMARY')
                    if (emojiMap[property]) {
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
                .setTitle(`${message.client.name}\'s Commands`)
                .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **Command Information:** \`${prefix}help [command]\`
          ${(!all && size != total) ? `**All Commands:** \`${prefix}help all\`` : ''}\n
        `)
                .setFooter(`Expires in 60 seconds \nFor text-only help command, type ${prefix}texthelp \n` + message.member.displayName ,
                    message.author.displayAvatarURL({ dynamic: true })
                )
                .setTimestamp()
                .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
                .setColor(message.guild.me.displayHexColor)
                .addField(
                    '**Links**',
                    `[Invite Me](${message.client.link}) | [Support Server](${message.client.config.supportServer}) | ` +
                    `Developed By ${message.client.ownerTag}`)

            const chunks = 4 //tweak this to add more items per line
            let rows = new Array(Math.ceil(allButtons.length / chunks)).fill().map(r=> {
                const row = new MessageActionRow();
                const buttons = allButtons.splice(0, chunks);
                buttons.forEach(b=>{
                    row.addComponents(b)
                })
                return row;
            });


            let msg = await message.channel.send({ components: rows, embeds: [embed] });

            const filter = (button) => button.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 60000, dispose: true });
            let tempEmbed = new MessageEmbed().setTitle(`${message.client.name}\'s Commands`)
                .setDescription(`**Prefix:** \`${prefix}\`\n**Command Information:** \`${prefix}help [command]\`\n${(!all && size != total) ? `**All Commands:** \`${prefix}help all\`` : ''}\n`)
                .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
            
            collector.on('collect', b => {

                const type = `${b.customId}`.replace(/_/g, ' ')
                tempEmbed.fields = []
                tempEmbed = tempEmbed.setFooter(`Expires in 60 seconds \nFor text-only help command, type ${prefix}texthelp \n` + message.member.displayName ,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setTimestamp()
                    .setColor("RANDOM")

                if (type === `Slash Only Commands`)
                    tempEmbed.addField(`${emojis.verified_developer} **/${type}**`, `` + commands[type])
                else
                    tempEmbed.addField(`**${emojiMap[type]} [${commands[type].length}]**`, `${emojiMap[type].includes('Admin') ? 'Commands can be cleared by replacing "set" with "clear".\ni.e `setmodlog` ➔ `clearmodlog`\n-----------------------------------------------------\n' : ''} ${commands[type].join(', ')}`);

                msg.edit({ components: rows, embeds: [tempEmbed] });
                b.deferUpdate()
            });
            collector.on('end', () => {
                tempEmbed.setFooter(`Expired! \nFor text-only help command, type ${prefix}texthelp \n` + message?.member?.displayName ,
                    message.author.displayAvatarURL({ dynamic: true })
                )
                msg.edit({ components: [], embeds: [tempEmbed] });
            });
        }
    }
};