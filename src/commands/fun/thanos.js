const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class thanosCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'thanos',

            usage: 'thanos <user mention/id>',
            description: 'Generates a thanos image',
            type: client.types.FUN,
            examples: ['thanos @split'],
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
        const buffer = await context.client.ameApi.generate('thanos', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'thanos.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
