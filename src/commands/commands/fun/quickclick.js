const Command = require('../../Command.js');
const { QuickClick } = require('weky');
const Discord = require('discord.js');

module.exports = class QuickClickCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'quickclick',
      aliases: ['fastclick'],
      usage: 'quickclick',
      description: 'A game which is you compete with people on speed clicking a button.',
      type: client.types.FUN
    });
  }
 async run(message, args) {
    await QuickClick({
	message: message,
	embed: {
		title: 'Quick Click',
		color: 'RANDOM',
    footer: 'Speed',
		timestamp: true
	},
	time: 60000,
	waitMessage: 'The buttons may appear anytime now!',
	startMessage:
		'First person to press the correct button will win. You have **{{time}}**!',
	winMessage: 'GG, <@{{winner}}> pressed the button in **{{time}} seconds**.',
	loseMessage: 'No one pressed the button in time. So, I dropped the game!',
	emoji: '👆',
	ongoingMessage:
		"A game is already runnning in <#{{channel}}>. You can't start a new one!"
});
 }
}
