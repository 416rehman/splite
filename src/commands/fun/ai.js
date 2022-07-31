const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class AiCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ai',
            aliases: ['ask'],
            usage: 'mock <text>',
            cooldown: 120,
            description:
                'Uses artificial intelligence to generate a response to your message',
            type: client.types.FUN,
            examples: ['ai how old is the sun'],
            slashCommand: new SlashCommandBuilder().addStringOption((o) => o.setName('question').setRequired(true).setDescription('The question you want to ask')),
            disabled: !client.config.apiKeys.openAI.apiKey
        });
    }

    run(message, args) {
        const text = args.join(' ');
        if (!text) return message.reply(`${fail} Please provide a question to ask`);

        this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction.options.getString('question'), interaction, true);
    }

    async handle(question, context, isInteraction) {

        if (!question.endsWith('?') && !question.endsWith('.')) question += '?';
        const response = await this.client.openai.createCompletion('text-davinci-002', {
            prompt: question,
            temperature: 0,
            max_tokens: 64,
        });

        if (response.data.choices) {
            const embed = new MessageEmbed()
                .setDescription(response.data.choices.map(c => c.text).join('\n'))
                .setTitle(question)
                .setAuthor({
                    name: 'AI',
                    icon_url: this.getAvatarURL(context.author)
                })
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    icon_url: this.getAvatarURL(context.author)
                })
                .setTimestamp();

            if (isInteraction) {
                context.editReply({
                    embeds: [embed]
                });
            }
            else {
                context.reply({
                    embeds: [embed]
                });
            }
        }
        else {
            context.reply(`${fail} ${response.data.error || 'Sorry, I couldn\'t find a response'}`);
        }

    }
};
