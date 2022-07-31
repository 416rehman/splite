const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');

module.exports = class wantedCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'wanted',
            usage: 'wanted <user mention/id>',
            description: 'Generates a wanted image',
            type: client.types.FUN,
            examples: ['wanted @split'],
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
        try {
            const buffer = await context.client.ameApi.generate('wanted', {
                url: this.getAvatarURL(targetUser, 'png'),
            });
            const payload = {files: [new MessageAttachment(buffer, 'wanted.png')]};

            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }
        catch (err) {
            const payload = {
                embeds: [new MessageEmbed()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('RED')],
            };
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }
    }
};
