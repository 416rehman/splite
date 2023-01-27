const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearMessageDeleteLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmessagedeletelog',
            aliases: ['clearmsgdeletelog', 'clearmdl', 'cmdl'],
            usage: 'clearmessagedeletelog',
            description: oneLine`
        Clears the message delete log text channel for your server. 
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearmessagedeletelog'],
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
        const messageDeleteLogId =
            this.client.db.settings.selectMessageDeleteLogId
                .pluck()
                .get(context.guild.id);
        const oldMessageDeleteLog =
            context.guild.channels.cache.get(messageDeleteLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`message delete log\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateMessageDeleteLogId.run(
            null,
            context.guild.id
        );

        const payload = {
            embeds: [
                embed.addFields({
                    name: 'Message Delete Log',
                    value: `${oldMessageDeleteLog} ➔ \`None\``
                }),
            ],
        };

        this.sendReply(context, payload);
    }
};
