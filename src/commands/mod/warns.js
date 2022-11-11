const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class WarnsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'warns',
            aliases: ['warnings'],
            usage: 'warns <user mention/ID>',
            description:
                'Displays a member\'s current warnings. A max of 5 warnings can be displayed at one time.',
            type: client.types.MOD,
            userPermissions: ['KICK_MEMBERS'],
            examples: ['warns @split'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setRequired(true).setDescription('The user to view warnings for'))
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args.join(' ')) || message.member;

        await this.handle(member, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.member;
        await this.handle(user, interaction);
    }

    async handle(member, context) {
        let warns = this.client.db.users.selectWarns
            .pluck()
            .get(member.id, context.guild.id) || {warns: []};
        if (typeof warns == 'string') warns = JSON.parse(warns);
        const count = warns.warns.length;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: this.getUserIdentifier(member),
                iconURL: this.getAvatarURL(member),
            })
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const buildEmbed = async (current, embed) => {
            const max = count > current + 5 ? current + 5 : count;
            let amount = 0;
            for (let i = current; i < max; i++) {
                embed // Build warning list
                    .addFields([{name: '\u200b', value:  `**Warn \`#${i + 1}\`**`}])
                    .addFields([{name: 'Reason', value:  warns.warns[i].reason}])
                    .addFields([{
                        name: 'Moderator',
                        value: (await context.guild.members.fetch(warns.warns[i].mod))
                            ?.toString() || '`Unable to find moderator`',
                        inline: true
                    }])
                    .addFields([{name: 'Date Issued', value:  warns.warns[i].date, inline:  true}]);
                amount += 1;
            }

            return embed
                .setTitle(
                    'Warn List ' +
                    this.client.utils.getRange(warns.warns, current, 5)
                )
                .setDescription(
                    `Showing \`${amount}\` of ${member}'s \`${count}\` total warns.`
                );
        };

        if (count == 0) {
            const payload = {
                embeds: [
                    embed
                        .setTitle('Warn List [0]')
                        .setDescription(`${member} currently has no warns.`),
                ],
            };
            await this.sendReply(context, payload);
        }
        else if (count < 5) {
            const payload = {embeds: [await buildEmbed(0, embed)]};
            await this.sendReply(context, payload);
        }
        else {
            let n = 0;
            const json = embed
                .setFooter({
                    text:
                        'Expires after three minutes.\n' + context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .toJSON();

            const first = () => {
                if (n === 0) return;
                n = 0;
                return buildEmbed(n, new EmbedBuilder(json));
            };

            const previous = () => {
                if (n === 0) return;
                n -= 5;
                if (n < 0) n = 0;
                return buildEmbed(n, new EmbedBuilder(json));
            };

            const next = () => {
                const cap = count - (count % 5);
                if (n === cap || n + 5 === count) return;
                n += 5;
                if (n >= count) n = cap;
                return buildEmbed(n, new EmbedBuilder(json));
            };

            const last = () => {
                const cap = count - (count % 5);
                if (n === cap || n + 5 === count) return;
                n = cap;
                if (n === count) n -= 5;
                return buildEmbed(n, new EmbedBuilder(json));
            };

            const reactions = {
                '⏪': first,
                '◀': previous,
                '▶': next,
                '⏩': last,
                '⏹': null,
            };

            const menu = new ButtonMenu(this.client, context.channel, context.member, await buildEmbed(n, new EmbedBuilder(json)), null, null, reactions);

            menu.functions['⏹'] = menu.stop.bind(menu);
        }
    }
};
