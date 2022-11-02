const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearModLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmodlog',
            aliases: ['clearml', 'cml'],
            usage: 'clearmodlog',
            description: oneLine`
        clears the mod log text channel for your server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearmodlog'],
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
        const modLogId = this.client.db.settings.selectModLogId
            .pluck()
            .get(context.guild.id);
        const oldModLog = context.guild.channels.cache.get(modLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(`The \`mod log\` was successfully cleared. ${success}`)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        // Clear if no args provided
        this.client.db.settings.updateModLogId.run(null, context.guild.id);
        const payload = ({
            embeds: [embed.addFields([{name: 'Mod Log', value:  `${oldModLog} ➔ \`None\``}])],
        });

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
