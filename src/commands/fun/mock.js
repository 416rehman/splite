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
    if (!args[0] && !message.reference) return this.sendErrorMessage(message, 0, 'Please provide some text');
    message.guild.funInProgress.set(message.author.id, 'fun');

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        let text1, text2;
        const __ret = this.getTexts(message, text1, text2, args);
        text1 = __ret.text1;
        text2 = __ret.text2;
        const buffer = await msg.client.utils.generateImgFlipImage(102918669, `${text1}`, `${text2}`)

        if (buffer)
        {
          const attachment = new MessageAttachment(buffer, "mocking.png");

          await message.channel.send(text1 + text2, attachment)
          await msg.delete()
        }
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
    })
    message.guild.funInProgress.delete(message.author.id)
  }

  getTexts(message, text1, text2, args) {
    return new Promise(((resolve, reject) => {
      if (message.reference) {
        message.channel.messages.fetch(message.reference.messageID).then(ref => {
          text1 = ref.author.username + ': '
          text2 = message.client.utils.spongebobText(ref.content)
          resolve ({text1, text2})
        })
      } else {
        text1 = message.mentions.users.size > 0 ? message.mentions.users.first().username + ': ' : ''
        text2 = message.client.utils.spongebobText(args.join(' '))
        if (text1.length > 0) text2 = text2.replace(`<@!${message.mentions.users.first().id}>`, '')
        resolve ({text1, text2})
      }
      reject('Failed')
    }))
  }
};
