const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fail} = require('../../utils/emojis.json');

const reward = 10;
const timeout = 30000;

module.exports = class geoGuessrCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'geoguessr',
            aliases: ['geo', 'gg', 'geoguesser'],
            usage: 'geoguessr',
            description: oneLine`
        Compete against your friends in a game of geoGuessr (anyone can answer).
        Correct answer rewards ${reward} points.
        The question will expire after ${timeout / 1000} seconds.
      `,
            type: client.types.FUN,
            examples: ['geoguessr'],
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        if (!this.client.topics?.geoguessr?.length) {
            if (isInteraction) {
                return context.editReply({
                    content: `${fail} No GeoGuessr questions available.`,
                });
            }
            else {
                return context.loadingMessage ? context.loadingMessage.edit({
                    content: `${fail} No GeoGuessr questions available.`,
                }) : context.channel.send({
                    content: `${fail} No GeoGuessr questions available.`,
                });
            }
        }
        const topic =
            this.client.topics.geoguessr[
                Math.floor(Math.random() * this.client.topics.geoguessr.length)
            ];

        const path = __basedir + '/data/geoguessr/' + topic + '.yaml';
        const questions = YAML.parse(fs.readFileSync(path, 'utf-8'));

        // get random question
        const n = Math.floor(Math.random() * Object.keys(questions).length);
        const question = Object.keys(questions)[n];
        const answers = questions[question];
        const origAnswers = [...answers].map(a => `\`${a}\``);

        // Clean answers
        for (let i = 0; i < answers.length; i++) {
            answers[i] = answers[i]
                .trim()
                .toLowerCase()
                .replace(/\.|'|-|\s/g, '');
        }

        // Get user answer
        const questionEmbed = new MessageEmbed()
            .setTitle('geoGuessr')
            .addField('Topic', `\`${this.client.utils.capitalize(topic.replace('-', ' '))}\``)
            .addField('Question', `${question}`)
            .setFooter({
                text: `Expires in ${timeout / 1000} seconds`,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        const url = question.match(/\bhttps?:\/\/\S+/gi);
        if (url) questionEmbed.setImage(url[0]);
        if (isInteraction) {
            context.editReply({
                embeds: [questionEmbed]
            }).then(m => setTimeout(() => m.delete(), timeout + timeout * 0.2));
        }
        else {
            context.loadingMessage ? context.loadingMessage.edit({
                embeds: [questionEmbed]
            }) : context.channel.send({
                embeds: [questionEmbed]
            }).then(m => setTimeout(() => m.delete(), timeout + timeout * 0.2));


            setTimeout(() => context.loadingMessage.delete(), timeout + timeout * 0.2);
        }
        let winner;

        const collector = context.channel.createMessageCollector({
            filter: (m) => !m.author.bot,
            time: timeout
        }); // Wait 30 seconds

        collector.on('collect', (msg) => {
            if (
                answers.includes(
                    msg.content
                        .trim()
                        .toLowerCase()
                        .replace(/\.|'|-|\s/g, '')
                )
            ) {
                winner = msg.author;
                collector.stop();
            }
        });
        collector.on('end', () => {
            const answerEmbed = new MessageEmbed()
                .setTitle('geoGuessr')
                .setFooter({
                    text: this.getUserIdentifier(winner || context.author),
                    iconURL: this.getAvatarURL(winner || context.author),
                })
                .setTimestamp();

            if (winner) {
                this.client.db.users.updatePoints.run(
                    {points: reward},
                    winner.id,
                    context.guild.id
                );
                context.channel.send({
                    embeds: [
                        answerEmbed.setDescription(
                            `Congratulations ${winner}, you gave the correct answer!`
                        ).addField('Points Earned', `**+${reward}** ${emojis.point}`),
                    ],
                }).then(m => setTimeout(() => m.delete(), 10000));
            }
            else
                context.channel.send({
                    embeds: [
                        answerEmbed
                            .setDescription('Sorry, time\'s up! Better luck next time.')
                            .addField('Correct Answers', origAnswers.join('\n')),
                    ],
                }).then(m => setTimeout(() => m.delete(), 10000));
        });
    }
};
