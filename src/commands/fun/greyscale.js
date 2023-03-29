const Command = require('../Command.js');

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
        await this.sendAmethystEmbed(context, 'greyscale', {targetUser});
    }
};
