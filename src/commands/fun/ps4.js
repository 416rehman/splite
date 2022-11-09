const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class ps4Command extends Command {
    constructor(client) {
        super(client, {
            name: 'ps4',

            usage: 'ps4 <user mention/id>',
            description: 'Generates a ps4 image',
            type: client.types.FUN,
            examples: ['ps4 @split'],
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
        const buffer = await context.client.ameApi.generate('ps4', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'ps4.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
