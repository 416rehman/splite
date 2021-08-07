const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class changemymindCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'changemymind',

      usage: 'changemymind <text>',
      description: 'Generates a changemymind image with provided text',
      type: client.types.FUN,
      examples: [`changemymind ${client.name} is the best bot!`]
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide some text');
    message.guild.funInProgress.set(message.author.id, 'fun');

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.nekoApi.generate("changemymind", { text: `${args.join(' ')}` })
        const attachment = new MessageAttachment(buffer, "changemymind.png");

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
