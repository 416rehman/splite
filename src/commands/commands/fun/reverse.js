const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class ReverseCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'reverse',
      usage: 'reverse <text>',
      description: 'Reverse some text',
      type: client.types.FUN,
      examples: ['reverse stun zeed']
    });
  }
 run(message, args) {
   const zamn = args.join(' ')
   if (!zamn) return this.sendErrorMessage(message, 0, 'Please provide some text');
   message.channel.send(zamn.split('').reverse().join(''))
    }
  };
