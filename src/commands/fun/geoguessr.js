const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');

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
        });
    }

    run(message) {
        if (!this.client.topics?.geoguessr?.length) return message.channel.send('There are no geoGuessr questions available.');
        const topic =
            message.client.topics.geoguessr[
                Math.floor(Math.random() * message.client.topics.geoguessr.length)
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
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        const url = question.match(/\bhttps?:\/\/\S+/gi);
        if (url) questionEmbed.setImage(url[0]);
        message.channel.send({embeds: [questionEmbed]});
        let winner;

        const collector = message.channel.createMessageCollector({
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
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            if (winner) {
                message.client.db.users.updatePoints.run(
                    {points: reward},
                    winner.id,
                    message.guild.id
                );
                message.channel.send({
                    embeds: [
                        answerEmbed.setDescription(
                            `Congratulations ${winner}, you gave the correct answer! **+${reward} Points!** ${emojis.points}`
                        ),
                    ],
                });
            }
            else
                message.channel.send({
                    embeds: [
                        answerEmbed
                            .setDescription('Sorry, time\'s up! Better luck next time.')
                            .addField('Correct Answers', origAnswers.join('\n')),
                    ],
                });
        });
    }
};
