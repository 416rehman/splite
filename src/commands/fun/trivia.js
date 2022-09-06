const Command = require('../Command.js');
const {
    MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fail} = require('../../utils/emojis.json');

const reward = 10;
const timeout = 30000;

module.exports = class TriviaCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'trivia',
            aliases: ['triv', 't'],
            usage: 'trivia',
            cooldown: 5,
            description: oneLine`
        Compete against your friends in a game of trivia (anyone can answer).
        Correct answer rewards ${reward} points.
        The question will expire after ${timeout / 1000} seconds.
      `,
            type: client.types.FUN,
            examples: ['trivia sports'],
            slashCommand: new SlashCommandBuilder().addStringOption(topic => topic.setName('topic').setRequired(false).setDescription('The topic to play trivia on')
                .addChoices(client.topics.trivia.map(topic => {
                    return [topic, topic];
                })))
        });
    }

    run(message) {
        if (!this.client.topics?.trivia?.length) return message.channel.send('There are no trivia questions available.');
        const row = new MessageActionRow().addComponents(new MessageSelectMenu()
            .setCustomId('trivia-topic')
            .setPlaceholder('Select a topic')
            .addOptions(this.client.topics.trivia.map(topic => {
                return {
                    label: this.client.utils.capitalize(topic.replace('-', ' ')), // description: topic,
                    value: topic
                };
            })));

        message.reply({
            embeds: [new MessageEmbed().setDescription('**Trivia** - Please select a category.')], components: [row]
        }).then(msg => {
            const filter = (option) => {
                option.deferUpdate();
                return option.user.id === message.author.id;
            };

            const selectCollector = msg.createMessageComponentCollector({
                filter, componentType: 'SELECT_MENU', maxUsers: 1, time: 30000
            });

            selectCollector.on('collect', (component) => {
                const topic = component.values[0];
                if (!topic) return;
                msg.edit({
                    components: []
                });

                this.handle(topic, message, false);
            });
        });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const topic = interaction.options.getString('topic') || this.client.topics.trivia[Math.floor(Math.random() * this.client.topics.trivia.length)];
        this.handle(topic, interaction, true);
    }

    async handle(topic, context) {
        try {
            // Get question and answers
            const path = __basedir + '/data/trivia/' + topic + '.yaml';
            const questions = YAML.parse(fs.readFileSync(path, 'utf-8'));
            // get random question
            const n = Math.floor(Math.random() * Object.keys(questions).length);
            const question = Object.keys(questions)[n];
            const answers = questions[question];
            const origAnswers = [...answers].map(a => `\`${a}\``);

            const url = question.match(/\bhttps?:\/\/\S+/gi);

            // 3 wrong and 1 correct choices
            const choices = [];

            for (let i = 0; i < 3; i++) {
                let x = Math.floor(Math.random() * Object.keys(questions).length);
                if (x === n) x = (x + 1) % Object.keys(questions).length;
                const question = Object.keys(questions)[x];
                const answer = questions[question][0];
                choices.push(answer);
            }

            choices.push(answers[0]);
            // Shuffle choices
            choices.sort(() => Math.random() - 0.5);


            const row = new MessageActionRow();
            const choiceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

            let correctAnswerIndex = '0';

            choices.forEach((choice, i) => {
                if (choice === answers[0]) correctAnswerIndex = `${i}`;
                row.addComponents(new MessageButton()
                    .setCustomId(`${i}`)
                    .setLabel(`${choice}`)
                    .setEmoji(choiceEmojis[i])
                    .setStyle('PRIMARY'));
            });

            const questionEmbed = new MessageEmbed()
                .setTitle('Trivia')
                .addField('Topic', `\`${this.client.utils.capitalize(topic.replace('-', ' '))}\``)
                .addField('Question', `${question}`)
                .setFooter({
                    text: `Expires in ${timeout / 1000} seconds`, iconURL: this.getAvatarURL(context.author)
                })
                .setImage(url ? url[0] : undefined)
                .setTimestamp();

            const payload = {
                embeds: [questionEmbed], components: [row]
            };

            const msg = await this.sendReply(context, payload);

            // Get user answer
            let winner;
            const answeredUsers = new Set();
            const collector = msg.createMessageComponentCollector({
                componentType: 'BUTTON', time: timeout, dispose: true
            });

            collector.on('collect', interaction => {
                if (answeredUsers.has(interaction.user.id)) {
                    interaction.reply({
                        content: `${emojis.fail} You have already answered this question.`, ephemeral: true
                    });
                    return;
                }
                answeredUsers.add(interaction.user.id);
                if (interaction.customId === correctAnswerIndex) {
                    winner = interaction.user;
                    collector.stop();
                    interaction.reply({
                        content: `${emojis.success} Correct answer! You have won ${reward} points.`, ephemeral: false
                    });
                }
                else {
                    interaction.reply({
                        content: `${emojis.fail} Incorrect answer.`, ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                answeredUsers.length = 0;
                if (winner) {
                    this.client.db.users.updatePoints.run({points: reward}, winner.id, context.guild.id);

                    const payload = {
                        embeds: [questionEmbed
                            .setFooter({text: `Answered by ${winner.tag}`, iconURL: this.getAvatarURL(winner)})
                            .addField('Winner', winner.toString())
                        ],
                        components: []
                    };

                    msg.edit(payload);
                }
                else {
                    const payload = {
                        embeds: [questionEmbed
                            .setDescription('Sorry, time\'s up! Better luck next time.')
                            .addField('Question', `${question}`)
                            .addField('Correct Answer', origAnswers[0])],
                        components: []
                    };

                    msg.edit(payload);
                }
            });
        }
        catch (err) {
            const payload = {
                embeds: [new MessageEmbed()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('RED')],
            };
            this.sendReply(context, payload);
        }
    }
};
