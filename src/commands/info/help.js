const Command = require('../Command.js');
const {EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');

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
            examples: ['help ping'],
            slashCommand: new SlashCommandBuilder().addStringOption((o) => o.setName('command').setDescription('The command to get information about.').setRequired(false))
        });
    }

    run(message, args) {
        const commandString = args[0];
        this.handle(commandString, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const commandString = interaction.options.getString('command');
        await this.handle(commandString, interaction, true);
    }

    async handle(commandString, context) {
        // Get disabled commands
        let disabledCommands = this.client.db.settings.selectDisabledCommands.pluck().get(context.guild.id) || [];
        if (typeof disabledCommands === 'string') disabledCommands = disabledCommands.split(' ');

        const all = commandString === 'all' ? commandString : '';
        const embed = new EmbedBuilder();
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id); // Get prefix
        const {
            INFO, FUN, POINTS, SMASHORPASS, NSFW, MISC, MOD, MUSIC, ADMIN, MANAGER, OWNER,
        } = this.client.types;
        const {capitalize} = this.client.utils;

        const command = this.client.commands.get(commandString) || this.client.aliases.get(commandString);

        // Build specific command help embed
        if (command
            && ((command.type !== OWNER || this.client.isOwner(context.member)) || (command.type !== MANAGER || this.client.isManager(context.member)))
            && !disabledCommands.includes(command.name)) {

            const embed = this.createHelpEmbed(context, command, prefix);

            const payload = {embeds: [embed]};
            this.sendReply(context, payload);
        }
        else if (commandString && !all) {
            const payload = `${emojis.fail} **${capitalize(commandString)} is not a valid command.** Please try again.`;
            this.sendReply(context, payload);
        }
        else {
            // Get commands
            const commands = {};
            for (const type of Object.values(this.client.types)) {
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
                [MANAGER]: `${emojis.manager} ${capitalize(MANAGER)}`,
                [OWNER]: `${emojis.owner} ${capitalize(OWNER)}`,
            };

            this.client.commands.forEach((command) => {
                if (!disabledCommands.includes(command.name) && !command.name.startsWith('clear')) {
                    if (command.type === this.client.types.OWNER && !this.client.isOwner(context.member)) return;
                    if (command.type === this.client.types.MANAGER && !this.client.isManager(context.member)) return;

                    if (command.userPermissions && command.userPermissions.every((p) => context.member.permissions.has(p)) && !all) {
                        if (command?.slashCommand?.name) commands[command.type].push(`\`${command.slashCommand.name}\``);
                        else commands[command.type].push(`\`${command.name}\``);
                    }
                    else if (!command.userPermissions || all) {
                        if (command?.slashCommand?.name) commands[command.type].push(`\`${command.slashCommand.name}\``);
                        else commands[command.type].push(`\`${command.name}\``);
                    }
                }
            });

            commands['Slash Only Commands'] = this.client.slashCommands.map((s) => {
                if (s.name === 'view') {
                    if (context.member.permissions.has('MANAGE_GUILD')) return `\`${s.name}\` ${s.description}`;
                }
                else return `\`${s.name}\` ${s.description}`;
            });
            commands['Slash Only Commands'] = commands['Slash Only Commands'].join('\n');

            const allButtons = [];
            for (const property in commands) {
                if (commands[property].length) {
                    const button = new ButtonBuilder()
                        .setCustomId(`${property.replace(/ /g, '_')}`)
                        .setLabel(`${capitalize(property)}`)
                        .setStyle(ButtonStyle.Primary);
                    if (emojiMap[property]) {
                        const animated = emojiMap[property].match(/(?<=<)(.*?)(?=:)/)[1] || '';
                        const name = emojiMap[property].match(/(?<=:)(.*?)(?=:)/)[1];
                        const id = emojiMap[property]
                            .match(/(?<=:)(.*?)(?=>)/)[1]
                            .split(':')[1];
                        button.setEmoji({name: name, id: id, animated: !!animated});
                    }

                    allButtons.push(button);
                }
            }
            const total = Object.values(commands).reduce((a, b) => a + b.length, 0) - commands[OWNER].length;
            const size = this.client.commands.size - commands[OWNER].length;

            embed // Build help embed
                .setTitle(`${this.client.name}'s Commands`)
                .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **Command Information:** \`${prefix}help [command]\`
          ${!all && size !== total ? `**All Commands:** \`${prefix}help all\`` : ''}\n
        `)
                .setFooter({
                    text: 'Expires in 60 seconds' + context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp()
                .setThumbnail(`${this.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
                .addFields([{name: '**Links**', value:  `[Invite Me](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot%20applications.commands) | [Support Server](${this.client.config.supportServer})`}]);

            const chunks = 4; //tweak this to add more items per line
            let rows = new Array(Math.ceil(allButtons.length / chunks))
                .fill()
                .map(() => {
                    const row = new ActionRowBuilder();
                    const buttons = allButtons.splice(0, chunks);
                    buttons.forEach((b) => {
                        row.addComponents(b);
                    });
                    return row;
                });

            let msg;
            const payload = {components: rows, embeds: [embed],};

            msg = await this.sendReply(context, payload);


            const filter = (button) => button.user.id === context.author.id;
            const collector = msg.createMessageComponentCollector({
                filter, componentType: ComponentType.Button, time: 60000, dispose: true,
            });
            let tempEmbed = new EmbedBuilder()
                .setTitle(`${this.client.name}'s Commands`)
                .setDescription(`**Prefix:** \`${prefix}\`\n**Command Information:** \`${prefix}help [command]\`\n${!all && size !== total ? `**All Commands:** \`${prefix}help all\`` : ''}\n`)
                .setThumbnail(`${this.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`);

            collector.on('collect', (b) => {
                const type = `${b.customId}`.replace(/_/g, ' ');
                tempEmbed.fields = [];
                tempEmbed = tempEmbed
                    .setFooter({
                        text: 'Expires in 60 seconds - ' + context.member.displayName,
                        iconURL: this.getAvatarURL(context.author),
                    })
                    .setTimestamp();

                if (type === 'Slash Only Commands') {
                    // empty fields
                    tempEmbed.setFields([]);
                    tempEmbed.addFields([{
                        name: `${emojis.verified_developer} **/${type}**`, value: '' + commands[type]
                    }]);
                }

                else {
                    // empty fields
                    tempEmbed.setFields([]);
                    tempEmbed.addFields([{
                        name: `**${emojiMap[type]} [${commands[type].length}]**`,
                        value:  `${emojiMap[type].includes('Admin') ? 'Use "clear" to clear, i.e `setmodlog` ➔ `clearmodlog`\n\n' : ''} ${commands[type].join(', ')}`,
                    }]);
                }

                msg.edit({components: rows, embeds: [tempEmbed]});
                b.deferUpdate();
            });
            collector.on('end', () => {
                embed.setFooter({
                    text: 'Expired! \nFor text-only help command - ' + this.getUserIdentifier(context.member),
                    iconURL: this.getAvatarURL(context.member),
                });
                msg.edit({components: [], embeds: [embed]});
            });
        }
    }
};
