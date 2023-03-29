const Command = require('../Command.js');

module.exports = class distortCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'distort',

            usage: 'distort <user mention/id>',
            description: 'Generates a distort image',
            type: client.types.FUN,
            examples: ['distort @split'],
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
        await this.sendAmethystEmbed(context, 'distort', {targetUser});
    }
};
