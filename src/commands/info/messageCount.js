const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const emojis = require('../../utils/emojis.json');
const { stripIndent } = require('common-tags');

module.exports = class messageCountCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'messagecount',
      aliases: ['count', 'messages', 'activity'],
      usage: 'messageCount',
      description: 'Fetches number of messages sent by users.',
      type: client.types.INFO,
      examples: ['messageCount @splite', 'messageCount @CoolRole']
    });
  }
  async run(message, args) {
    if (!args[0])  //All server messages
    {
      console.log(`AUTHOR: ` + message.author.constructor.name)
    } else if (args[0]) //User/Role messages
    {
      const target = this.getRoleFromMention(message, args[0]) ||
          await message.guild.roles.cache.get(args[0]) ||
          await this.getMemberFromMention(message, args[0]) ||
          await message.guild.members.cache.get(args[0]) ||
          message.author;
      console.log(target.constructor.name)
      switch (target.constructor.name) {
        case 'User':
        {
          const messages = message.client.db.users.selectMessageCount.get(target.id, message.guild.id);
          console.log(messages)
        }
        case 'Role':
        {
          const messages = message.client.db.users.selectMessageCount.get(target.id, message.guild.id);
          console.log(messages)
        }
        default:
        {

        }
      }
    }
  }
};
