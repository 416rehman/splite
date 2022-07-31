const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const answers = [
    'It is certain.',
    'It is decidedly so.',
    'Without a doubt.',
    'Yes - definitely.',
    'You may rely on it.',
    'As I see it, yes.',
    'Most likely.',
    'Outlook good.',
    'Yes.',
    'Signs point to yes.',
    'Reply hazy, try again.',
    'Ask again later.',
    'Better not tell you now.',
    'Cannot predict now.',
    'Concentrate and ask again.',
    'Don\'t count on it.',
    'My reply is no.',
    'My sources say no.',
    'Outlook not so good.',
    'Very doubtful.',
];

module.exports = class EightBallCommand extends Command {
    constructor(client) {
        super(client, {
            name: '8ball',
            aliases: ['fortune'],
            usage: '8ball <question>',
            description: 'Asks the Magic 8-Ball for some psychic wisdom.',
            type: client.types.FUN,
            examples: ['8ball Am I going to win the lottery?'],
            slashCommand: new SlashCommandBuilder().addStringOption((o) => o.setName('question').setRequired(true).setDescription('The question you want to ask')),
        });
    }

    run(message, args) {
        if (!args.join(' '))
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a question to ask'
            );
        this.handle(message, args, false);
    }

    interact(interaction) {
        this.handle(interaction, null, true);
    }

    async handle(context, args, isInteraction) {
        const question = isInteraction ? context.options.getString('question') : args.join(' ');
        const embed = new MessageEmbed()
            .setTitle('🎱  The Magic 8-Ball  🎱')
            .addField('Question', question)
            .addField(
                'Answer',
                `${answers[Math.floor(Math.random() * answers.length)]}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        if (isInteraction) {
            await context.reply({
                embeds: [embed],
            });
        }
        else {
            context.reply({
                embeds: [embed],
            });
        }
    }
};
