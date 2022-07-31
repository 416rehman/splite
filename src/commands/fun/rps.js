const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {load} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');
const rps = ['scissors', 'rock', 'paper'];
const res = ['Scissors :v:', 'Rock :fist:', 'Paper :raised_hand:'];

module.exports = class RockPaperScissorsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rps',
            usage: 'rps <rock | paper | scissors>',
            description: `Play a game of rock–paper–scissors against ${client.name}!`,
            type: client.types.FUN,
            examples: ['rps rock'],
            slashCommand: new SlashCommandBuilder().addStringOption(s => s.setName('choice').setRequired(true).setDescription('Your choice').addChoices(
                [
                    ['rock', 'rock'],
                    ['paper', 'paper'],
                    ['scissors', 'scissors'],
                ])),
        });
    }

    async run(message, args) {
        let userChoice;
        if (args.length) userChoice = args[0].toLowerCase();
        if (!rps.includes(userChoice))
            return this.sendErrorMessage(
                message,
                0,
                'Please enter rock, paper, or scissors'
            );

        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(userChoice || 6, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const choice = interaction.options.getString('choice');
        this.handle(choice, interaction, true);
    }

    handle(choice, context, isInteraction) {
        const userChoice = rps.indexOf(choice);
        const botChoice = Math.floor(Math.random() * 3);
        let result;
        if (userChoice === botChoice) result = 'It\'s a draw!';
        else if (botChoice > userChoice || (botChoice === 0 && userChoice === 2))
            result = `**${this.client.name}** wins!`;
        else result = `**${context.author}** wins!`;

        const payload = {
            embeds: [new MessageEmbed()
                .setTitle(`${this.getUserIdentifier(context.author)} vs. ${this.client.name}`)
                .addField('Your Choice:', res[userChoice], true)
                .addField(`${this.client.name}'s Choice`, res[botChoice], true)
                .addField('Result', result, true)
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })]
        };

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
    }
};
