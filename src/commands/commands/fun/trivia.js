const Command = require('../../Command.js');
const { Trivia } = require('weky');
const Discord = require('discord.js');

module.exports = class TriviaCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'trivia',
      usage: 'trivia',
      description: 'Test your knowledge about things.',
      type: client.types.FUN
    });
  }
 async run(message, args) {
    await Trivia({
	message: message,
	embed: {
		title: 'Trivia',
		description: 'You only have **{{time}}** to guess the answer!',
		color: 'RED',
        footer: message.member.displayName,
		timestamp: true
	},
	difficulty: 'hard',
	thinkMessage: 'I am thinking',
	winMessage:
		'GG, It was **{{answer}}**. You gave the correct answer in **{{time}}**.',
	loseMessage: 'Better luck next time! The correct answer was **{{answer}}**.',
	emojis: {
		one: '1️⃣',
		two: '2️⃣',
		three: '3️⃣',
		four: '4️⃣',
	},
	othersMessage: 'Only <@{{author}}> can use the buttons!',
	returnWinner: false
  });
 }
}
