const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class clydeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clyde',

      usage: 'clyde <text>',
      description: 'Generates a clyde image with provided text',
      type: client.types.FUN,
      examples: [`clyde ${client.name} is the best bot!`]
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide some text');
    message.guild.funInProgress.set(message.author.id, 'fun');

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.nekoApi.generate("clyde", { text: `${args.join(' ')}` })
        const attachment = new MessageAttachment(buffer, "clyde.png");

        await message.channel.send(attachment)
        await msg.delete()
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
    message.guild.funInProgress.delete(message.author.id)
  }
};
