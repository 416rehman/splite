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
    // Get message
    let member;

    if (!args[0]) member = message.author
    else member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]);

    message.channel.send(new MessageEmbed().setDescription(`${load} Loading...`)).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("brazzers", { url: member.avatarURL({ format: "png", size: 512 }) });
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
