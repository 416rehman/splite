const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
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

    handle(context, isInteraction) {
        const autoKick =
            this.client.db.settings.selectAutoKick
                .pluck()
                .get(context.guild.id) || 'disabled';

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(context?.guild?.iconURL({dynamic: true}))
            .setDescription(`\`Auto kick\` was successfully disabled. ${success}`)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.client.db.settings.updateAutoKick.run(null, context.guild.id);

        const payload = {embeds: [embed.addField('Auto Kick', `\`${autoKick}\` ➔ \`disabled\``),],};

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
