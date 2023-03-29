const Command = require('../Command.js');


module.exports = class rejectedCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rejected',
            aliases: ['reject'],
            usage: 'rejected <user mention/id>',
            description: 'Generates a rejected image',
            type: client.types.FUN,
            examples: ['rejected @split'],
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
        await this.sendAmethystEmbed(context, 'rejected', {targetUser});
    }
};
