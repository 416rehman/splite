const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');

module.exports = class SetMuteRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setmuterole',
            aliases: ['setmur', 'smur'],
            usage: 'setmuterole <role mention/ID>',
            description:
                'Sets the `mute role` your server.\nUse `clearmuterole` to clear the current `mute role`.',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setmuterole @Muted', 'clearmuterole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        await this.handle(role, interaction, true);
    }

    async handle(role, context, isInteraction) {
        const muteRoleId = this.client.db.settings.selectMuteRoleId.pluck().get(context.guild.id);
        const oldMuteRole = context.guild.roles.cache.find((r) => r.id === muteRoleId) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!role) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{name: 'Current Mute Role', value: `${oldMuteRole}` || '`None`'}])
                        .setDescription(this.description),
                ],
            });

            this.sendReply(context, payload);
            return;
        }

        // Update role
        role = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!role) {
            const payload = `${fail} I couldn't find that role.`;
            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateMuteRoleId.run(role.id, context.guild.id);

        const payload = ({
            embeds: [embed.addFields([{name: 'Mute Role', value: `${oldMuteRole} ➔ ${role}`}])
                .setDescription(`The \`mute role\` was successfully updated. ${success}\nUse \`clearmuterole\` to clear the current \`mute role\``)],
        });

        await this.sendReply(context, payload);
    }
};
