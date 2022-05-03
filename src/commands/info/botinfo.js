const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const pkg = require(__basedir + '/package.json');
const {oneLine, stripIndent} = require('common-tags');
const emojis = require('../../utils/emojis.json');

module.exports = class BotInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'botinfo',
            aliases: ['bot', 'bi'],
            usage: 'botinfo',
            description: `Fetches ${client.name}'s bot information.`,
            type: client.types.INFO,
        });
    }

    run(message) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);
        const tech = stripIndent`
      Version     :: ${pkg.version}
      Library     :: Discord.js v13.1.0
      Environment :: Node.js v16.8.0
      Database    :: SQLite
    `;
        const embed = new MessageEmbed()
            .setTitle(`${message.client.name}'s Bot Information`)
            .setDescription(
                oneLine`
        ${message.client.name} a multi-purpose bot. Based on Calypso.
      `
            )
            .addField('Prefix', `\`${prefix}\``, true)
            .addField('Client ID', `\`${message.client.user.id}\``, true)
            .addField('Tech', `\`\`\`asciidoc\n${tech}\`\`\``)
            .addField(
                'Links',
                `**[Invite Me](${message.client.config.inviteLink})**`
            )
            .setImage('https://i.imgur.com/B0XSinY.png')
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        if (this.client.owners.length > 0) {
            embed.addField('Developed By', `${this.client.owners[0]}`);
            if (this.client.owners.length > 1)
                embed.addField(`${emojis.owner} Bot Owner${this.client.owners.length > 1 ? 's' : ''}`, this.client.owners.map((owner) => `${owner}`).join(', '));
        }
        if (this.client.managers.length > 0) {
            embed.addField(`${emojis.manager} Bot Manager${this.client.managers.length > 1 ? 's' : ''}`, this.client.managers.map((manager) => `${manager}`).join(', '));
        }

        message.channel.send({embeds: [embed]});
    }
};
