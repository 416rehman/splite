const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetAutoKickCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setautokick',
            aliases: ['setak', 'sak'],
            usage: 'setautokick <warn count>',
            description: oneLine`
        Sets the amount of warns needed before ${client.name} will automatically kick someone from your server.\nUse \`clearautokick\` to disable \`auto kick\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setautokick 3', 'clearautokick'],
        });
    }

    run(message, args) {
        const amount = args[0];
        if (args[0] && (!Number.isInteger(Number(amount)) || amount < 0))
            return this.sendErrorMessage(
                message,
                0,
                'Please enter a positive integer'
            );

        this.handle(amount, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const amount = interaction.options.getInteger('amount');
        this.handle(amount, interaction, true);
    }

    handle(amount, context) {
        const autoKick =
            this.client.db.settings.selectAutoKick
                .pluck()
                .get(context.guild.id) || 'disabled';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))

            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        if (!amount) {
            const payload = ({
                embeds: [
                    embed
                        .addFields([{name: 'Current Auto Kick', value: `\`${autoKick}\``}])
                        .setDescription(this.description),
                ],
            });

            return this.sendReply(context, payload);
        }

        this.client.db.settings.updateAutoKick.run(amount, context.guild.id);
        const payload = ({
            embeds: [
                embed.addFields([{name: 'Auto Kick', value: `\`${autoKick}\` ➔ \`${amount}\``}])
                    .setDescription(
                        `\`Auto kick\` was successfully updated. ${success}\nUse \`clearautokick\` to disable \`auto kick\``
                    )
            ],
        });

        return this.sendReply(context, payload);
    }
};
