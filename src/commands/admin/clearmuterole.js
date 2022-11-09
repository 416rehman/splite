const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');

module.exports = class clearMuteRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmuterole',
            aliases: ['clearmur', 'cmur'],
            usage: 'clearmuterole',
            description: 'Clears the `mute role` your server.',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['Clearmuterole'],
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
        const muteRoleId = this.client.db.settings.selectMuteRoleId
            .pluck()
            .get(context.guild.id);
        const oldMuteRole =
            context.guild.roles.cache.find((r) => r.id === muteRoleId) || '`None`';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`mute role\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateMuteRoleId.run(null, context.guild.id);

        const payload = ({
            embeds: [embed.addFields([{name: 'Mute Role', value:  `${oldMuteRole} ➔ \`None\``}])],
        });

        this.sendReply(context, payload);
    }
};
