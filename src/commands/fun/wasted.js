const Command = require('../Command.js');

module.exports = class wastedCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wasted',

            usage: 'wasted <user mention/id>',
            description: 'Generates a wasted image',
            type: client.types.FUN,
            examples: ['wasted @split'],
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
        await this.sendAmethystEmbed(context, 'wasted', {targetUser});

    }
};
