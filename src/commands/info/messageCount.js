const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const emojis = require('../../utils/emojis.json');
const { stripIndent } = require('common-tags');

module.exports = class ServerInfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'serverinfo',
      aliases: ['server', 'si'],
      usage: 'serverinfo',
      description: 'Fetches information and statistics about the server.',
      type: client.types.INFO
    });
  }
  async run(message, args) {
    if (!args[0])  //All server messages
    {

    } else if (args[0]) //User/Role messages
    {
      const target = this.getRoleFromMention(message, args[0]) ||
          await message.guild.roles.cache.get(args[0]) ||
          await this.getMemberFromMention(message, args[0]) ||
          await message.guild.members.cache.get(args[0]) ||
          message.author;

      console.log(target)
    }
  }
};
