const Command = require('../Command.js');
const { MessageEmbed, MessageCollector } = require('discord.js');
const fs = require('fs');
const YAML = require('yaml');
const { oneLine } = require('common-tags');

module.exports = class geoGuessrCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'smashorpass',
      aliases: ['sop', 'match', 'smash'],
      usage: 'smashorpass',
      description: oneLine`
        Play a game of smash or pass, you are shown a random user, you decide to smash or pass.
        Cost: 25 points per like
      `,
      type: client.types.FUN,
      examples: ['match', 'smash', 'smashorpass']
    });
  }
  run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    message.reply('This feature is in development at the moment!')
  }
};
