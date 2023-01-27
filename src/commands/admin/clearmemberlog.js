const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearMemberLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmemberlog',
            aliases: ['clearmeml', 'cmeml'],
            usage: 'clearmemberlog',
            description: oneLine`
        Clears the member join/leave log text channel for your server. 
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearmemberlog'],
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
        const memberLogId = this.client.db.settings.selectMemberLogId
            .pluck()
            .get(context.guild.id);
        const oldMemberLog =
            context.guild.channels.cache.get(memberLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`member log\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateMemberLogId.run(null, context.guild.id);

        const payload = {embeds: [embed.addFields([{name: 'Member Log', value: `${oldMemberLog} ➔ \`None\``}])],};

        this.sendReply(context, payload);
    }
};
