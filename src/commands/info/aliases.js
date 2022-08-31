const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');
const ButtonMenu = require('../ButtonMenu');

module.exports = class AliasesCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'aliases',
            aliases: ['alias', 'ali', 'a'],
            usage: 'aliases [command type]',
            description: oneLine`
        Displays a list of all current aliases for the given command type. 
        If no command type is given, the amount of aliases for every type will be displayed.
      `,
            type: client.types.INFO,
            examples: ['aliases Fun'],
        });
    }


    run(message, args) {
        // Get disabled commands
        let disabledCommands =
            this.client.db.settings.selectDisabledCommands
                .pluck()
                .get(message.guild.id) || [];
        if (typeof disabledCommands === 'string')
            disabledCommands = disabledCommands.split(' ');

        const aliases = {};
        const embed = new MessageEmbed();
        for (const type of Object.values(this.client.types)) {
            aliases[type] = [];
        }

        const type = args[0] ? args[0].toLowerCase() : '';
        const types = Object.values(this.client.types);
        const {
            INFO,
            FUN,
            POINTS,
            SMASHORPASS,
            NSFW,
            MISC,
            MOD,
            MUSIC,
            ADMIN,
            MANAGER,
            OWNER,
        } = this.client.types;
        const {capitalize} = this.client.utils;

        const emojiMap = {
            [INFO]: `${emojis.info} ${capitalize(INFO)}`,
            [FUN]: `${emojis.fun} ${capitalize(FUN)}`,
            [POINTS]: `${emojis.points} ${capitalize(POINTS)}`,
            [SMASHORPASS]: `${emojis.smashorpass} ${capitalize(SMASHORPASS)}`,
            [NSFW]: `${emojis.nsfw} ${capitalize(NSFW)}`,
            [MISC]: `${emojis.misc} ${capitalize(MISC)}`,
            [MOD]: `${emojis.mod} ${capitalize(MOD)}`,
            [MUSIC]: `${emojis.music} ${capitalize(MUSIC)}`,
            [ADMIN]: `${emojis.admin} ${capitalize(ADMIN)}`,
            [MANAGER]: `${emojis.manager} ${capitalize(MANAGER)}`,
            [OWNER]: `${emojis.owner} ${capitalize(OWNER)}`,
        };

        if (
            args[0] &&
            types.includes(type) &&
            (type !== OWNER || this.client.isOwner(message.member)) &&
            (type !== MANAGER || this.client.isManager(message.member))
        ) {

            this.client.commands.forEach((command) => {
                if (
                    command.aliases &&
                    command.type === type &&
                    !disabledCommands.includes(command.name) && !command.name.startsWith('clear')
                )
                    aliases[command.type].push(
                        `**${command.name}:** ${command.aliases
                            .map((a) => `\`${a}\``)
                            .join(' ')}`
                    );
            });

            embed.setTitle(`Alias Type: \`${capitalize(type)}\``)
                .setThumbnail(
                    `${
                        this.client.config.botLogoURL ||
                        'https://i.imgur.com/B0XSinY.png'
                    }`
                )
                .setFooter({
                    text: message.member.displayName,
                    iconURL: this.getAvatarURL(message.author),
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);


            if (aliases[type].length <= 20) {
                const range = aliases[type].length === 1 ? '[1]' : `[1 - ${aliases[type].length}]`;
                message.channel.send({
                    embeds: [
                        embed
                            .setTitle(`Alias Type: \`${capitalize(type)}\` ${range}`)
                            .setDescription(aliases[type].join('\n')),
                    ],
                });
            }
            else
                new ButtonMenu(
                    this.client,
                    message.channel,
                    message.member,
                    embed,
                    aliases[type]
                );
        }
        else if (type) {
            return this.sendErrorMessage(
                message,
                0,
                'Unable to find command type, please check provided type'
            );
        }
        else {

            this.client.commands.forEach((command) => {
                if (command.aliases && !disabledCommands.includes(command.name))
                    aliases[command.type].push(
                        `**${command.name}:** ${command.aliases
                            .map((a) => `\`${a}\``)
                            .join(' ')}`
                    );
            });

            const prefix = this.client.db.settings.selectPrefix
                .pluck()
                .get(message.guild.id);

            embed
                .setTitle(`${this.client.name}'s Alias Types`)
                .setDescription(
                    stripIndent`
          **Prefix:** \`${prefix}\`
          **More Information:** \`${prefix}aliases [command type]\`
        `
                )
                .setImage('https://i.imgur.com/B0XSinY.png')
                .setFooter({
                    text: message.member.displayName,
                    iconURL: this.getAvatarURL(message.author),
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);

            for (const type of Object.values(this.client.types)) {
                if (type === OWNER && !this.client.isOwner(message.member))
                    continue;
                if (type === MANAGER && !this.client.isManager(message.member))
                    continue;
                if (aliases[type][0])
                    embed.addField(
                        `**${emojiMap[type]}**`,
                        `
            \`${aliases[type].reduce(
        (a, b) => a + b.split(' ').slice(1).length,
        0
    )}\` aliases`,
                        true
                    );
            }

            embed.addField(
                '**Links**',
                `**[Invite Me](${this.client.config.inviteLink})**`
            );
            if (this.client.owners.length) {
                embed.addField('Developed By', `${this.client.owners[0]}`);
            }

            message.channel.send({embeds: [embed]});
        }
    }
};
