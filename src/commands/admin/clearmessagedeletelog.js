const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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
            userPermissions: ['MANAGE_GUILD'],
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

    handle(context, isInteraction) {
        const messageDeleteLogId =
            this.client.db.settings.selectMessageDeleteLogId
                .pluck()
                .get(context.guild.id);
        const oldMessageDeleteLog =
            context.guild.channels.cache.get(messageDeleteLogId) || '`None`';
        const embed = new MessageEmbed()
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
                embed.addField(
                    'Message Delete Log',
                    `${oldMessageDeleteLog} ➔ \`None\``
                ),
            ],
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
