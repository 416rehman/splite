const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const emojis = require('../../utils/emojis.json');

module.exports = class SetPrefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setprefix',
            aliases: ['setp', 'sp'],
            usage: 'setprefix <prefix>',
            description:
                'Sets the command `prefix` for your server. The max `prefix` length is 3 characters.',
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setprefix !', 'clearprefix'],
        });
    }

    run(message, args) {
        const prefix = args[0];
        if (!prefix)
            return this.sendErrorMessage(message, 0, 'Please provide a prefix');

        this.handle(prefix, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const prefix = interaction.options.getString('prefix');
        await this.handle(prefix, interaction, true);
    }

    async handle(prefix, context, isInteraction) {
        if (prefix.length > 3) {
            const payload = emojis.fail + ' Please ensure the prefix is no larger than 3 characters';
            if (isInteraction) await context.reply(payload);
            else context.reply(payload);
            return;
        }

        const oldPrefix = this.client.db.settings.selectPrefix.pluck().get(context.guild.id);

        this.client.db.settings.updatePrefix.run(prefix, context.guild.id);
        await context.guild.members.me.setNickname(`[${this.client.db.settings.selectPrefix.pluck().get(context.guild.id)}] ${this.client.name}`);

        const payload = {
            embeds: [
                new EmbedBuilder()
                    .setTitle('Settings: `System`')
                    .setThumbnail(context.guild.iconURL({dynamic: true}))
                    .setDescription(`The \`prefix\` was successfully updated. ${success}`)
                    .addFields([{name: 'Prefix', value:  `\`${oldPrefix}\` ➔ \`${prefix}\``}])
                    .setFooter({
                        text: this.getUserIdentifier(context.author),
                        iconURL: this.getAvatarURL(context.author)
                    })
                    .setTimestamp()
            ]
        };

        if (isInteraction) await context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
