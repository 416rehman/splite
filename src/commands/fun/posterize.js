const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class posterizeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'posterize',
      aliases: [],
      usage: 'posterize <user mention/id>',
      description: 'Generates a posterize image',
      type: client.types.FUN,
      examples: ['posterize @split']
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    message.guild.funInProgress.set(message.author.id, 'fun');
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("posterize", { url: this.getAvatarURL(member) });
        const attachment = new MessageAttachment(buffer, "posterize.png");

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
