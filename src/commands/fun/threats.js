const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class threatsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'threats',
            aliases: ['threat'],
            usage: 'threats <user mention/id>',
            description: 'Generates a threats image',
            type: client.types.FUN,
            examples: ['threats @split'],
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
        const buffer = await context.client.nekoApi.generate('threats', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'threats.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
