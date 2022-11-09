const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class dictatorCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dictator',

            usage: 'dictator <user mention/id>',
            description: 'Generates a dictator image',
            type: client.types.FUN,
            examples: ['dictator @split'],
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
        const buffer = await context.client.ameApi.generate('dictator', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'dictator.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
