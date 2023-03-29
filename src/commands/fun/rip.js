const Command = require('../Command.js');


module.exports = class ripCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rip',

            usage: 'rip <user mention/id>',
            description: 'Generates a rip image',
            type: client.types.FUN,
            examples: ['rip @split'],
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
        await this.sendAmethystEmbed(context, 'rip', {targetUser});
    }
};
