const Command = require('../Command.js');
const {
    MessageEmbed,
    MessageActionRow,
    MessageSelectMenu,
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
                .addChoices(
                    client.topics.trivia.map(topic => {
                        return [topic, topic];
                    })
                ))
        });
    }

    run(message) {
        if (!this.client.topics?.trivia?.length) return message.channel.send('There are no trivia questions available.');
        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('trivia-topic')
                .setPlaceholder('Select a topic')
                .addOptions(this.client.topics.trivia.map(topic => {
                    return {
                        label: this.client.utils.capitalize(topic.replace('-', ' ')),
                        // description: topic,
                        value: topic
                    };
                }))
        );

        message.reply({
            embeds: [new MessageEmbed().setDescription('**Trivia** - Please select a category.')],
            components: [row]
        }).then(msg => {
            const filter = (option) => {
                option.deferUpdate();
                return option.user.id === message.author.id;
            };

            const selectCollector = msg.createMessageComponentCollector({
                filter,
                componentType: 'SELECT_MENU',
                maxUsers: 1,
                time: 30000
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

    handle(topic, context, isInteraction) {
        try {
            // Get question and answers
            const path = __basedir + '/data/trivia/' + topic + '.yaml';
            const questions = YAML.parse(fs.readFileSync(path, 'utf-8'));
            // get random question
            const n = Math.floor(Math.random() * Object.keys(questions).length);
            const question = Object.keys(questions)[n];
            const answers = questions[question];
            const origAnswers = [...answers].map(a => `\`${a}\``);

            // Clean answers
            for (let i = 0; i < answers.length; i++) {
                answers[i] = answers[i]?.trim().toLowerCase().replace(/\.|'|-|\s/g, '');
            }

            const url = question.match(/\bhttps?:\/\/\S+/gi);

            // Get user answer
            const payload = {
                embeds: [new MessageEmbed()
                    .setTitle('Trivia')
                    .addField('Topic', `\`${this.client.utils.capitalize(topic.replace('-', ' '))}\``)
                    .addField('Question', `${question}`)
                    .setFooter({
                        text: `Expires in ${timeout / 1000} seconds`,
                        iconURL: this.getAvatarURL(context.author)
                    })
                    .setImage(url ? url[0] : undefined)
                    .setTimestamp()]
            };

            if (isInteraction) context.editReply(payload).then(m => setTimeout(() => m.delete(), timeout + timeout * 0.3));
            else {
                if (context.loadingMessage) {
                    context.loadingMessage.edit(payload);
                    setTimeout(() => context.loadingMessage.delete(), timeout + timeout * 0.3);
                }
                else {
                    context.channel.send(payload).then(m => setTimeout(() => m.delete(), timeout + timeout * 0.3));
                }
            }

            let winner;

            const collector = context.channel.createMessageCollector({
                filter: (m) => !m.author.bot,
                time: timeout
            }); // Wait 30 seconds

            collector.on('collect', msg => {
                if (answers.includes(msg.content.trim().toLowerCase().replace(/\.|'|-|\s/g, ''))) {
                    winner = msg.author;
                    msg.react('✅');
                    collector.stop();
                }
            });

            collector.on('end', () => {
                const answerEmbed = new MessageEmbed()
                    .setTitle('Trivia')
                    .setFooter({
                        text: this.getUserIdentifier(context.author),
                        iconURL: this.getAvatarURL(context.author)
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
                            answerEmbed.setDescription(`Congratulations ${winner}, you gave the correct answer!`)
                                .addField('Points Earned', `**+${reward}** ${emojis.point}`),
                        ]
                    });
                }
                else {
                    const payload = {
                        embeds: [
                            answerEmbed
                                .setDescription('Sorry, time\'s up! Better luck next time.')
                                .addField('Question', `${question}`)
                                .addField('Correct Answers', origAnswers.join('\n'))
                        ]
                    };

                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
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
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }
    }
};
