const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class HateCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'hate',
      aliases: ['fuck', 'allmyhomies', 'homies'],
      usage: 'hate <text>',
      description: 'Generates an "all my homies hate" image with provided text',
      type: client.types.FUN,
      examples: [`hate ${client.name} is the best bot!`],
      cooldown: 5
    });
  }
  async run(message, args) {
    

    message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg=>{
      try {
        const text = await message.client.utils.replaceMentionsWithNames(args.join(' '), message.guild)
        const buffer = await msg.client.utils.generateImgFlipImage(242461078, `${text}`, `${text}`, '#EBDBD1', '#2E251E')

        if (buffer)
        {
          const attachment = new MessageAttachment(buffer, "allmyhomieshate.png");

          await message.channel.send({files: [attachment]})
          await msg.delete()
        }
      }
      catch (e) {
        await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
      }
    })
  }
};
