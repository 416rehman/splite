const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class AiCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ai',
            aliases: ['ask'],
            usage: 'mock <text>',
            cooldown: 60,
            description:
                'Uses artificial intelligence to generate a response to your message',
            type: client.types.FUN,
            examples: ['ai how old is the sun'],
            slashCommand: new SlashCommandBuilder().addStringOption((o) => o.setName('question').setRequired(true).setDescription('The question you want to ask')),
            disabled: !client.config.apiKeys?.openAI?.apiKey
        });
    }

    run(message, args) {
        const text = args.join(' ');
        if (!text) return message.reply(`${fail} Please provide a question to ask`);

        this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction.options.getString('question'), interaction, true);
    }

    async handle(question, context) {

        if (!question.endsWith('?') && !question.endsWith('.')) question += '?';
        const response = await this.client.openai.createCompletion('text-davinci-002', {
            prompt: question,
            temperature: 0,
            max_tokens: 64,
        });

        if (response.data.choices) {
            const embed = new EmbedBuilder()
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

            const payload = {
                embeds: [embed]
            }; await this.sendReply(context, payload);
        }
        else {
            context.reply(`${fail} ${response.data.error || 'Sorry, I couldn\'t find a response'}`);
        }

    }
};
