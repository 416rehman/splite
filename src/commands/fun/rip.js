const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {load} = require('../../utils/emojis.json');

module.exports = class ripCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rip',

            usage: 'rip <user mention/id>',
            description: 'Generates a rip image',
            type: client.types.FUN,
            examples: ['rip @split'],
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args.join(' '))) || message.author;
        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(member, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.author;
        this.handle(member, interaction, true);
    }

    async handle(targetUser, context, isInteraction) {
        const buffer = await context.client.ameApi.generate('rip', {
            url: this.getAvatarURL(targetUser, 'png'),
        });
        const attachment = new MessageAttachment(buffer, 'rip.png');

        if (isInteraction) {
            context.editReply({
                files: [attachment],
            });
        }
        else {
            context.loadingMessage ? context.loadingMessage.edit({
                files: [attachment],
                embeds: []
            }) : context.channel.send({
                files: [attachment],
            });
        }
    }
};
