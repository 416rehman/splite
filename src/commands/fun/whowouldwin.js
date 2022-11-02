const Command = require('../Command.js');
const {EmbedBuilder, AttachmentBuilder} = require('discord.js');
const {load} = require('../../utils/emojis.json');
const fetch = require('node-fetch');
const {SlashCommandBuilder} = require('discord.js');
module.exports = class whowouldwinCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'whowouldwin',
            aliases: ['www', 'vs'],
            usage: 'whowouldwin <user mention/id>',
            description: 'Generates a whowouldwin image',
            type: client.types.FUN,
            examples: ['whowouldwin @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((u) => u.setName('user').setRequired(false).setDescription('Opponent to whowouldwin with')).addUserOption((u) => u.setName('user2').setRequired(false).setDescription('The user to whowouldwin with')),
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0] || this.client.db.users.getRandom.get(message.guild.id).user_id);
        const member2 =
            (await this.getGuildMember(message.guild, args[1])) || message.author;

        if (!member || !member2) return this.sendErrorMessage(message, 'Could not find the user you specified.');

        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(member, member2, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || await this.getGuildMember(interaction.guild, this.client.db.users.getRandom.get(interaction.guild.id).user_id);
        const member2 = interaction.options.getUser('user2') || interaction.author;
        await this.handle(member, member2, interaction, true);
    }

    async handle(member, member2, context, isInteraction) {
        const res = await fetch(
            encodeURI(
                `https://nekobot.xyz/api/imagegen?type=whowouldwin&user1=${this.getAvatarURL(
                    member
                )}&user2=${this.getAvatarURL(member2)}`
            )
        );
        const json = await res.json();
        const attachment = new AttachmentBuilder(
            json.message,
            'whowouldwin.png'
        );

        if (isInteraction) {
            context.editReply({
                content: `<@${member.id}> **VS** <@${member2.id}>`,
                files: [attachment],
            }).then(m => {
                if (m.channel.permissionsFor(m.guild.members.me).has('ADD_REACTIONS'))
                    m.react('👈').then(() => m.react('👉'));
            });
        }
        else {
            if (context.loadingMessage) {
                context.loadingMessage.edit({
                    content: `<@${member.id}> **VS** <@${member2.id}>`,
                    files: [attachment],
                    embeds: []
                });
                context.loadingMessage.react('👈').then(() => context.loadingMessage.react('👉'));
            }
            else {
                context.channel.send({
                    content: `<@${member.id}> **VS** <@${member2.id}>`,
                    files: [attachment],
                }).then(m => {
                    if (m.channel.permissionsFor(m.guild.members.me).has('ADD_REACTIONS'))
                        m.react('👈').then(() => m.react('👉'));
                });
            }
        }
    }
};
