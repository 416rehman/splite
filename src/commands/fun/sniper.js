const Command = require('../Command.js');
const {AttachmentBuilder} = require('discord.js');


module.exports = class sniperCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'sniper',

            usage: 'sniper <user mention/id>',
            description: 'Generates a sniper image',
            type: client.types.FUN,
            examples: ['sniper @split'],
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
        const buffer = await context.client.ameApi.generate('sniper', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new AttachmentBuilder(buffer, { name:  'sniper.png' });

        const payload = {
            files: [attachment],
        }; await this.sendReply(context, payload);
    }
};
