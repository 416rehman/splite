const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class baguetteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'baguette',
            usage: 'baguette <user mention/id>',
            description: 'Generates a baguette image',
            type: client.types.FUN,
            examples: ['baguette @split'],
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
        const buffer = await context.client.nekoApi.generate('baguette', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'baguette.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
