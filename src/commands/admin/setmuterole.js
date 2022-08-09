const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setmuterole @Muted', 'clearmuterole'],
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const role = interaction.options.getRole('role');
        this.handle(role, interaction, true);
    }

    async handle(role, context, isInteraction) {
        const muteRoleId = this.client.db.settings.selectMuteRoleId.pluck().get(context.guild.id);
        const oldMuteRole = context.guild.roles.cache.find((r) => r.id === muteRoleId) || '`None`';

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: context.member.displayName,
                iconURL: context.author.displayAvatarURL({dynamic: true}),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!role) {
            const payload = ({
                embeds: [
                    embed
                        .addField('Current Mute Role', `${oldMuteRole}` || '`None`')
                        .setDescription(this.description),
                ],
            });

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        // Update role
        role = isInteraction ? role : await this.getGuildRole(context.guild, role);
        if (!role) {
            const payload = `${fail} I couldn't find that role.`;
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
            return;
        }

        this.client.db.settings.updateMuteRoleId.run(role.id, context.guild.id);

        const payload = ({
            embeds: [embed.addField('Mute Role', `${oldMuteRole} ➔ ${role}`)
                .setDescription(`The \`mute role\` was successfully updated. ${success}\nUse \`clearmuterole\` to clear the current \`mute role\``)],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
