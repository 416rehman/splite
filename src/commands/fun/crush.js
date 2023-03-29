const Command = require('../Command.js');

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
        await this.sendAmethystEmbed(context, 'crush', {targetUser});
    }
};
