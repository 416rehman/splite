const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const moment = require('moment');
const {mem, cpu, os} = require('node-os-utils');
const {stripIndent} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const pkg = require(__basedir + '/package.json');

module.exports = class BotInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'botinfo',
            aliases: ['statistics', 'metrics', 'stats', 'bot', 'bi'],
            usage: 'botinfo',
            description: `Fetches ${client.name}'s statistics.`,
            type: client.types.INFO,
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context) {
        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);
        const d = moment.duration(this.client.uptime);
        const days = d.days() === 1 ? `${d.days()} day` : `${d.days()} days`;
        const hours = d.hours() === 1 ? `${d.hours()} hour` : `${d.hours()} hours`;
        const minutes =
            d.minutes() === 1 ? `${d.minutes()} minute` : `${d.minutes()} minutes`;
        const seconds =
            d.seconds() === 1 ? `${d.seconds()} second` : `${d.seconds()} seconds`;
        const date = moment().subtract(d, 'ms').format('dddd, MMMM Do YYYY');

        const clientStats = stripIndent`
      Servers   :: ${this.client.guilds.cache.size}
      Users     :: ${this.client.users.cache.size}
      Channels  :: ${this.client.channels.cache.size}
      WS Ping   :: ${Math.round(this.client.ws.ping)}ms
    `;
        const {totalMemMb, usedMemMb} = await mem.info();
        const serverStats = stripIndent`
      OS        :: ${await os.oos()}
      CPU       :: ${cpu.model()}
      Cores     :: ${cpu.count()}
      CPU Usage :: ${await cpu.usage()} %
      RAM       :: ${totalMemMb} MB
      RAM Usage :: ${usedMemMb} MB 
    `;

        const tech = stripIndent`
      Version     :: ${pkg.version}
      Library     :: Discord.js ${pkg.dependencies['discord.js'].replace('^', '')}
      Environment :: Node.js v16.8.0
      Database    :: SQLite
    `;
        const time = stripIndent`
      Uptime      :: ${days}, ${hours}, ${minutes}, and ${seconds}
      Started     :: ${date}
    `;

        const embed = new EmbedBuilder()
            .setTitle(`${this.client.name}'s Statistics`)
            .addFields(
                {name: 'Prefix', value: `\`${prefix}\``},
                {name: 'Client ID', value: `\`${this.client.user.id}\``},
                {name: 'Commands', value: `\`${this.client.commands.size}\` commands`, inline: true},
                {name: 'Aliases', value: `\`${this.client.aliases.size}\` aliases`, inline: true},
                {
                    name: 'Command Types',
                    value: `\`${Object.keys(this.client.types).length}\` command types`,
                    inline: true
                },
                {name: 'Client', value: `\`\`\`asciidoc\n${clientStats}\`\`\``},
                {name: 'Server', value: `\`\`\`asciidoc\n${serverStats}\`\`\``},
                {name: 'Tech', value: `\`\`\`asciidoc\n${tech}\`\`\``},
                {name: 'Time', value: `\`\`\`asciidoc\n${time}\`\`\``},
                {
                    name: 'Links',
                    value: `**[Invite Me](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot%20applications.commands)**`
                },
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (this.client.owners?.length > 0) {
            embed.addFields([{name: 'Developed By', value: `<@${this.client.owners[0]}>`}]);
            if (this.client.owners.length > 1)
                embed.addFields([{
                    name: `${emojis.owner} Bot Owner${this.client.owners.length > 1 ? 's' : ''}`,
                    value: this.client.owners.map(o => `<@${o}>`).join(', inline:  ')
                }]);
        }
        if (this.client.managers?.length > 0) {
            embed.addFields([{
                name: `${emojis.manager} Bot Manager${this.client.managers.length > 1 ? 's' : ''}`,
                value: this.client.managers.map(o => `<@${o}>`).join(', inline:  ')
            }]);
        }

        const payload = {embeds: [embed]};
        await this.sendReply(context, payload);
    }
};
