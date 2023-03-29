const Command = require('../Command.js');

module.exports = class sharpenCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'sharpen',

            usage: 'sharpen <user mention/id>',
            description: 'Generates a sharpen image',
            type: client.types.FUN,
            examples: ['sharpen @split'],
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
        await this.sendAmethystEmbed(context, 'sharpen', {targetUser});
    }
};
