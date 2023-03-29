const Command = require('../Command.js');

module.exports = class contrastCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'contrast',

            usage: 'contrast <user mention/id>',
            description: 'contrast a burn image',
            type: client.types.FUN,
            examples: ['contrast @split'],
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
        await this.sendAmethystEmbed(context, 'contrast', {targetUser});
    }
};
