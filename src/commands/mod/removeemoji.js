const Command = require('../Command.js');
const {parseEmoji, EmbedBuilder} = require('discord.js');
const _emojis = require('../../utils/emojis.json');

module.exports = class RemoveEmojiCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'removeemoji',
            aliases: ['remove', 'rem', 'deleteemoji', 'dem', 'remoji', 'delete'],
            usage: 'removeemoji <emoji>',
            description: 'Delete emojis from the server.',
            type: client.types.MOD,
            clientPermissions: [
                'SEND_MESSAGES',
                'EMBED_LINKS',
                'MANAGE_EMOJIS_AND_STICKERS',
            ],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['removeemoji 🙄', 'rem 😂 😙 😎'],
        });
    }

    run(message, args) {
        if (!args[0]) return message.reply({embeds: [this.createHelpEmbed(message, 'Remove Emoji', this)]});
        this.handle(args, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const emojis = interaction.options.getString('emojis');
        const args = emojis.split(' ');
        await this.handle(args, interaction);
    }

    async handle(emojis, context) {
        try {
            this.sendReplyAndDelete(context, 'Removing emojis', 1000);
            for (const emoji of emojis) {
                await removeemoji(emoji, context, this);
            }
        }
        catch (err) {
            this.client.logger.error(err);
            this.sendErrorMessage(
                context,
                1,
                'An error occured while removing the emoji. Common reasons are:- Deleting an emoji that is not from this server.',
                err
            );
        }
    }
};

async function removeemoji(emoji, context, command) {
    if (!emoji)
        command.sendErrorMessage(context, 0, 'Please mention a valid emoji.');
    let customemoji = parseEmoji(emoji); //Check if it's a emoji

    customemoji = await context.guild.emojis.cache.find(
        (e) => e.id === customemoji.id
    );

    if (customemoji?.id) {
        customemoji.delete().then(() => {
            context.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${_emojis.success} ${emoji} Removed!`)
                ],
            });
        });

        await command.sendModLogMessage(context, '', {
            Member: context.member.toString(),
            'Removed Emoji': `\`${emoji}\``,
        });
    }
    else
        return command.sendErrorMessage(
            context,
            0,
            `Please mention a custom emoji from THIS server. ${emoji} is invalid`
        );
}
