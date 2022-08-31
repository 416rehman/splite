const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
        this.handle(interaction, true);
    }

    async handle(context, isInteraction) {
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
      Library     :: Discord.js v13.1.0
      Environment :: Node.js v16.8.0
      Database    :: SQLite
    `;
        const time = stripIndent`
      Uptime      :: ${days}, ${hours}, ${minutes}, and ${seconds}
      Started     :: ${date}
    `;
        const embed = new MessageEmbed()
            .setTitle(`${this.client.name}'s Statistics`)
            .addField('Prefix', `\`${prefix}\``,)
            .addField('Client ID', `\`${this.client.user.id}\``,)
            .addField(
                'Commands',
                `\`${this.client.commands.size}\` commands`,
                true
            )
            .addField(
                'Aliases',
                `\`${this.client.aliases.size}\` aliases`,
                true
            )
            .addField(
                'Command Types',
                `\`${Object.keys(this.client.types).length}\` command types`,
                true
            )
            .addField('Client', `\`\`\`asciidoc\n${clientStats}\`\`\``)
            .addField('Server', `\`\`\`asciidoc\n${serverStats}\`\`\``)
            .addField('Tech', `\`\`\`asciidoc\n${tech}\`\`\``)
            .addField('Time', `\`\`\`asciidoc\n${time}\`\`\``)
            .addField(
                'Links',
                `**[Invite Me](${this.client.config.inviteLink})**`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (this.client.owners?.length > 0) {
            embed.addField('Developed By', `${this.client.owners[0]}`);
            if (this.client.owners.length > 1)
                embed.addField(`${emojis.owner} Bot Owner${this.client.owners.length > 1 ? 's' : ''}`, this.client.owners.join(', '));
        }
        if (this.client.managers?.length > 0) {
            embed.addField(`${emojis.manager} Bot Manager${this.client.managers.length > 1 ? 's' : ''}`, this.client.managers.join(', '));
        }

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
