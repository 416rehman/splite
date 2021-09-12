const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class redpleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'redple',
      aliases: ['red'],
      usage: 'redple <user mention/id>',
      description: 'Generates a redple image',
      type: client.types.FUN,
      examples: ['redple @split']
    });
  }
  async run(message, args) {
    
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

    message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("redple", { url: this.getAvatarURL(member) });
        const attachment = new MessageAttachment(buffer, "redple.png");

        await message.channel.send({files: [attachment]})
        await msg.delete()
      }
      catch (e) {
        await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
      }
    })
    
  }
};
