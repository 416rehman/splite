const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class hassCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'hass',
      aliases: [],
      usage: 'hass <user mention/id>',
      description: 'Random hentai/ass image',
      type: client.types.NSFW,
      examples: ['hass']
    });
  }
  async run(message, args) {
    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.nekoApi.get("hass")
        await msg.edit(new MessageEmbed().setDescription(`\u200b`).setImage(buffer))
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
  }
};
