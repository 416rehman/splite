const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class BrazzersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'brazzers',
      aliases: [],
      usage: 'brazzers <user mention/id>',
      description: 'Generates a brazzers image',
      type: client.types.FUN,
      examples: ['brazzers @split']
    });
  }
  async run(message, args) {
    console.log(args)
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;
    console.log(member.displayAvatarURL())

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("brazzers", { url: member.displayAvatarURL({ format: "png", size: 512 }) });
        const attachment = new MessageAttachment(buffer, "brazzers.png");

        await message.channel.send(attachment)
        await msg.delete()
      }
      catch (e) {
        await msg.edit(new MessageEmbed().setDescription(`${e}`))
      }
    })
  }
};
