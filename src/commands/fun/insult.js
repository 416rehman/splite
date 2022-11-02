const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {SlashCommandBuilder} = require('discord.js');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class insultCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'roast',
            aliases: ['insult'],
            usage: 'roast',
            description: 'Roast someone',
            type: client.types.FUN,
            examples: ['roast @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((u) => u.setName('user').setRequired(false).setDescription('The user to insult/roast')),
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args.join(' '))) || message.author;
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
        const member = interaction.options.getUser('user') || interaction.author;
        await this.handle(member, interaction, true);
    }

    async handle(targetUser, context, isInteraction) {
        try {
            const res = await fetch(
                'https://evilinsult.com/generate_insult.php?lang=en&type=json'
            );
            const insult = (await res.json()).insult;

            const embed = new EmbedBuilder()
                .setDescription(`<@${targetUser.id}>, ${insult}`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();

            if (isInteraction) {
                await context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed],
                }) : context.channel.send({
                    embeds: [embed],
                });
            }
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                await context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed]
                }) : context.channel.send({
                    embeds: [embed]
                });
            }
        }
    }
};
