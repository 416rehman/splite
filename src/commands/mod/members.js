const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {stripIndent} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class MembersCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rolemembers',
            aliases: ['mm', 'mem', 'mems', 'member', 'members'],
            usage: 'members <role mention/ID/name>',
            description: 'Displays members with the specified role. If no role is specified, displays how many server members are online, busy, AFK, and offline.',
            type: client.types.MOD,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'ManageRoles'],
            userPermissions: ['ManageRoles'],
            examples: ['members @bots', 'members 711797614697250856', 'members bots',],
            slashCommand: new SlashCommandBuilder()
                .addRoleOption(r => r.setName('role').setDescription('The role to display members for'))
        });
    }

    run(message, args) {
        let role = this.getGuildRole(message.guild, args.join(' '));
        if (!role) return this.sendErrorMessage(message, 0, 'Failed to find that role, try using a role ID');

        this.handle(role, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        await this.handle(role, interaction);
    }

    async handle(role, context) {
        if (!role) {
            const members = [...(await context.guild.members.fetch({cache: false})).values()];
            const online = members.filter((m) => m.presence?.status === 'online').length;
            const offline = members.filter((m) => !m.presence || m.presence?.status === 'offline').length;
            const dnd = members.filter((m) => m.presence?.status === 'dnd').length;
            const afk = members.filter((m) => m.presence?.status === 'idle').length;
            const embed = new EmbedBuilder()
                .setTitle(`Member Status [${context.guild.memberCount}]`)
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setDescription(stripIndent`
                        ${emojis.online} **Online:** \`${online}\` members
                        ${emojis.dnd} **Busy:** \`${dnd}\` members
                        ${emojis.idle} **AFK:** \`${afk}\` members
                        ${emojis.offline} **Offline:** \`${offline}\` members
                `)
                .setFooter({
                    text: context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();
            return this.sendReply(context, {embeds: [embed]});
        }

        let description = '';
        let i = 0;
        role.members.some((m) => {
            const user = `<@${m.user.id}> \n`;
            if (description.length + user.length < 2048) {
                description += user;
                i++;
            }
            else return true;
        });

        const embed = new EmbedBuilder()
            .setTitle(`Members of ${role.name}`)
            .setDescription(description)
            .setFooter({
                text: `${role.members.size} Members in ${role.name} | Showing ${i}`,
            });

        this.sendReply(context, {embeds: [embed]}).catch(() => {
            return this.sendErrorMessage(context, 0, 'Too many members to display. Please try another role with fewer members');
        });
    }
};
