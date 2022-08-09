const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');

module.exports = class clearModRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmodrole',
            aliases: ['clearmr', 'cmr'],
            usage: 'clearmodrole',
            description: 'clears the `mod role` for your server.',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearmodrole'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        const modRoleId = this.client.db.settings.selectModRoleId
            .pluck()
            .get(context.guild.id);
        const oldModRole =
            context.guild.roles.cache.find((r) => r.id === modRoleId) || '`None`';

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`mod role\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateModRoleId.run(null, context.guild.id);

        const payload = ({
            embeds: [embed.addField('Mod Role', `${oldModRole} ➔ \`None\``)],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
