const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearAutoRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearautorole',
            aliases: ['clearaur', 'caur'],
            usage: 'clearautorole',
            description: oneLine`
        clears the current \`auto role\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearautorole'],
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
        const autoRoleId = this.client.db.settings.selectAutoRoleId
            .pluck()
            .get(context.guild.id);
        const oldAutoRole =
            context.guild.roles.cache.find((r) => r.id === autoRoleId) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context?.guild?.iconURL({dynamic: true}))
            .setDescription(
                `The \`auto role\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.client.db.settings.updateAutoRoleId.run(null, context.guild.id);

        const payload = {embeds: [embed.addFields([{name: 'Auto Role', value: `${oldAutoRole}`}])],};

        this.sendReply(context, payload);
    }
};
