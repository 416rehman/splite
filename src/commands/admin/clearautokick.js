const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearautokickCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearautokick',
            aliases: ['clearak', 'cak'],
            usage: 'clearautokick',
            description: oneLine`
        Disables \`auto kick\` when enough warns have been issued.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearautokick'],
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
        const autoKick =
            this.client.db.settings.selectAutoKick
                .pluck()
                .get(context.guild.id) || 'disabled';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context?.guild?.iconURL({dynamic: true}))
            .setDescription(`\`Auto kick\` was successfully disabled. ${success}`)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.client.db.settings.updateAutoKick.run(null, context.guild.id);

        const payload = {embeds: [embed.addFields([{name: 'Auto Kick', value:  `\`${autoKick}\` ➔ \`disabled\``}]),],};

        this.sendReply(context, payload);
    }
};
