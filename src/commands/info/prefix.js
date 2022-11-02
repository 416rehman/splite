const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class PrefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'prefix',
            aliases: ['pre'],
            usage: 'prefix',
            description: `Fetches ${client.name}'s current prefix.`,
            type: client.types.INFO,
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context, isInteraction) {
        const prefix = this.client.db.settings.selectPrefix.pluck().get(context.guild.id);

        const payload = {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${this.client.name}'s Prefix`)
                    .setThumbnail(
                        `${
                            this.client.config.botLogoURL ||
                            'https://i.imgur.com/B0XSinY.png'
                        }`
                    )
                    .addFields([{name: 'Prefix', value:  `\`${prefix}\``, inline:  true}])
                    .addFields([{name: 'Example', value:  `\`${prefix}ping\``, inline:  true}])
                    .setFooter({text: `To change the prefix, type ${prefix}setprefix`})
                    .setTimestamp()
            ]
        };

        if (isInteraction) await context.editReply(payload);
        else context.reply(payload);
    }
};
