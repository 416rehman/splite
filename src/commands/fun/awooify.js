const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class awooifyCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'awooify',
            aliases: ['awooo'],
            usage: 'awooify <user mention/id>',
            description: 'awooify an image',
            type: client.types.FUN,
            examples: ['awooify @split'],
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
        const buffer = await context.client.nekoApi.generate('awooify', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'awooify.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
