const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class scaryCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'scary',

            usage: 'scary <user mention/id>',
            description: 'Generates a scary image',
            type: client.types.FUN,
            examples: ['scary @split'],
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
        const buffer = await context.client.ameApi.generate('scary', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'scary.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
