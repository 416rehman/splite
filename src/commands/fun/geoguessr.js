const Command = require('../Command.js');
const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

const reward = 10;
const timeout = 30000;

module.exports = class geoGuessrCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'geoguessr', aliases: ['geo', 'gg', 'geoguesser'], usage: 'geoguessr', description: oneLine`
        Compete against your friends in a game of geoGuessr (anyone can answer).
        Correct answer rewards ${reward} points.
        The question will expire after ${timeout / 1000} seconds.
      `, type: client.types.FUN, examples: ['geoguessr'], slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    async handle(context, isInteraction) {
        try {
            if (!this.client.topics?.geoguessr?.length) {
                const payload = `${fail} No GeoGuessr questions available.`;
                if (isInteraction) return this.sendReply(context, payload);
            }

            const topic = this.client.topics.geoguessr[Math.floor(Math.random() * this.client.topics.geoguessr.length)];

            const path = __basedir + '/data/geoguessr/' + topic + '.yaml';
            const questions = YAML.parse(fs.readFileSync(path, 'utf-8'));

            // get random question
            const n = Math.floor(Math.random() * Object.keys(questions).length);
            const question = Object.keys(questions)[n];
            const answers = questions[question];
            const origAnswers = [...answers].map(a => `\`${a}\``);

            // Choices to display
            const choices = [];

            // Wrong choices
            for (let i = 0; i < 3; i++) {
                let x = Math.floor(Math.random() * Object.keys(questions).length);
                if (x === n) x = (x + 1) % Object.keys(questions).length;
                const question = Object.keys(questions)[x];
                const answer = questions[question][0];
                choices.push(answer);
            }

            choices.push(answers[0]); // correct answer
            choices.sort(() => Math.random() - 0.5); // Shuffle choices

            const row = new ActionRowBuilder();
            const choiceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

            let correctAnswerIndex = '0';

            choices.forEach((choice, i) => {
                if (choice === answers[0]) correctAnswerIndex = `${i}`;
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`${i}`)
                    .setLabel(`${choice}`)
                    .setEmoji(choiceEmojis[i])
                    .setStyle(ButtonStyle.Secondary));
            });

            // Get user answer
            const questionEmbed = new EmbedBuilder()
                .setTitle('geoGuessr')
                .addFields([{
                    name: 'Topic',
                    value:  `\`${this.client.utils.capitalize(topic.replace('-', ' '))}\``
                }])
                .addFields([{name: 'Question', value:  `${question}`}])
                .setFooter({
                    text: `Expires in ${timeout / 1000} seconds`, iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();
            const url = question.match(/\bhttps?:\/\/\S+/gi);
            if (url) questionEmbed.setImage(url[0]);

            const payload = {
                embeds: [questionEmbed], components: [row]
            };

            const msg = await this.sendReply(context, payload);

            // Get user answer
            let winner;
            const answeredUsers = new Set();
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button, time: timeout, dispose: true
            });

            collector.on('collect', (interaction) => {
                if (answeredUsers.has(interaction.user.id)) {
                    interaction.reply({content: `${emojis.fail} You have already answered!`, ephemeral: true});
                    return;
                }
                answeredUsers.add(interaction.user.id);
                if (interaction.customId === correctAnswerIndex) {
                    winner = interaction.user;
                    collector.stop();
                    interaction.reply({
                        content: `${emojis.success} ${interaction.user} answered ${origAnswers[0]} correctly! **+${reward}** ${emojis.point} points.`,
                        ephemeral: true
                    });
                }
                else {
                    interaction.reply({content: `${emojis.fail} Incorrect answer!`, ephemeral: true});
                }
            });
            collector.on('end', () => {
                answeredUsers.length = 0;
                if (winner) {
                    this.client.db.users.updatePoints.run({points: reward}, winner.id, context.guild.id);

                    const payload = {
                        embeds: [questionEmbed
                            .setFooter({text: `Answered by ${winner.tag}`, iconURL: this.getAvatarURL(winner)})
                            .addFields([{name: 'Winner', value:  winner.toString()}])
                        ],
                        components: []
                    };

                    msg.edit(payload);
                }
                else {
                    const payload = {
                        embeds: [questionEmbed
                            .setDescription('Sorry, time\'s up! Better luck next time.')
                            .addFields([{name: 'Question', value:  `${question}`}])
                            .addFields([{name: 'Correct Answer', value:  origAnswers[0]}])
                            .setFooter({text: 'No one answered correctly', iconURL: this.getAvatarURL(context.author)})
                        ],
                        components: []
                    };

                    msg.edit(payload);
                }
            });
        }
        catch (err) {
            const payload = {
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('Red')]
            };
            await this.sendReply(context, payload);
        }
    }
};
