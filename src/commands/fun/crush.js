const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class crushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'crush',
            usage: 'crush <user mention/id>',
            description: 'Generates a crush image',
            type: client.types.FUN,
            examples: ['crush @split'],
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
        const buffer = await context.client.ameApi.generate('crush', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'crush.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
