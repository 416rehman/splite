const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class thighsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nsfw',
      aliases: ['nsfw'],
      usage: 'thighs <user mention/id>',
      description: 'Random nsfw image',
      type: client.types.FUN,
      nsfwOnly: true,
      examples: ['nsfw']
    });
  }
  async run(message, args) {
    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.nekoApi.get("thigh")
        await msg.edit(new MessageEmbed().setDescription(`\u200b`).setImage(buffer))
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
  }
};
