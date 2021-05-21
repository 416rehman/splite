const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class MockCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'mock',
      aliases: ['spongebob'],
      usage: 'mock <text>',
      description: 'Generates a "mocking-spongebob" image with provided text',
      type: client.types.FUN,
      examples: ['mock Splite is the best bot!']
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide some text');
    message.guild.funInProgress.set(message.author.id, 'fun');

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const text1 = message.mentions.users.size > 0 ? message.mentions.users.first().username + ':': ''
        const text2 = args.join(' ')
        const buffer = await msg.client.utils.generateImgFlipImage(102918669, `${text1}`, `${text2}`)

        if (buffer)
        {
          const attachment = new MessageAttachment(buffer, "mocking.png");

          await message.channel.send(attachment)
          await msg.delete()
        }
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
    message.guild.funInProgress.delete(message.author.id)
  }
};
