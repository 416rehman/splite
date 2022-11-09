const Command = require('../Command.js');
const {EmbedBuilder, AttachmentBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class greyscaleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'greyscale',
            aliases: ['grey', 'gray', 'grayscale'],
            usage: 'greyscale <user mention/id>',
            description: 'Generates a greyscale image',
            type: client.types.FUN,
            examples: ['greyscale @split'],
            disabled: client.ameApi === null,
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args.join(' '))) || message.author;
        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.author;
        await this.handle(member, interaction, true);
    }

    async handle(targetUser, context) {
        try {
            const buffer = await context.client.ameApi.generate('greyscale', {
                url: this.getAvatarURL(targetUser, 'png'),
            });
            const attachment = new AttachmentBuilder(buffer, { name:  'greyscale.png' });

            const payload = {
                files: [attachment],
            }; await this.sendReply(context, payload);
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('Red');
            const payload = {
                embeds: [embed],
            }; await this.sendReply(context, payload);
        }

    }
};
