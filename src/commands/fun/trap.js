const Command = require('../Command.js');
const {EmbedBuilder, AttachmentBuilder} = require('discord.js');
const {load} = require('../../utils/emojis.json');
const fetch = require('node-fetch');
module.exports = class trapCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'trap',
            aliases: ['trapcard'],
            usage: 'trap <user mention/id>',
            description: 'Generates a trap image',
            type: client.types.FUN,
            examples: ['trap @split'],
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0] || this.client.db.users.getRandom.get(message.guild.id).user_id);

        if (!member) return this.sendErrorMessage(message, 'Could not find the user you specified.');

        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(member, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || await this.getGuildMember(interaction.guild, this.client.db.users.getRandom.get(interaction.guild.id).user_id);
        await this.handle(member, interaction, true);
    }

    async handle(member, context, isInteraction) {
        const url = encodeURI(
            `https://nekobot.xyz/api/imagegen?type=trap&name=${
                member.username || member.user.username
            }&author=${
                context.author.username || context.author.user.username
            }&image=${
                this.getAvatarURL(member, 'png', true)
            }`
        );

        const res = await fetch(
            url
        );
        const json = await res.json();
        const attachment = new AttachmentBuilder(
            json.message,
            'trap.png'
        );

        if (isInteraction) {
            await context.editReply({
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
