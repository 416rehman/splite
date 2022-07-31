const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {load, fail} = require('../../utils/emojis.json');

module.exports = class insultCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'insult',
            aliases: ['roast'],
            usage: 'insult',
            description: 'Insult/roast someone',
            type: client.types.FUN,
            examples: ['insult @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((u) => u.setName('user').setRequired(false).setDescription('The user to insult/roast')),
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
            const res = await fetch(
                'https://evilinsult.com/generate_insult.php?lang=en&type=json'
            );
            const insult = (await res.json()).insult;

            const embed = new MessageEmbed()
                .setDescription(`<@${targetUser.id}>, ${insult}`)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();

            if (isInteraction) {
                context.editReply({
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
            const embed = new MessageEmbed()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                context.editReply({
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
