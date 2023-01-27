const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');

module.exports = class ClearAdminRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearadminrole',
            aliases: ['clearar', 'car'],
            usage: 'clearadminrole',
            description: 'Clears the `admin role` for your server.',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearadminrole'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context) {
        const adminRoleId = this.client.db.settings.selectAdminRoleId
            .pluck()
            .get(context.guild.id);
        const oldAdminRole =
            context.guild.roles.cache.find((r) => r.id === adminRoleId) ||
            '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`admin role\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.client.db.settings.updateAdminRoleId.run(null, context.guild.id);

        const payload = {embeds: [embed.addFields([{name: 'Admin Role', value: `${oldAdminRole} ➔ \`None\``}])],};

        this.sendReply(context, payload);
    }
};
