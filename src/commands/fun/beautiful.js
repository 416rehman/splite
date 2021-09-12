const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class beautifulCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'beautiful',

      usage: 'beautiful <user mention/id>',
      description: 'Generates a beautiful image',
      type: client.types.FUN,
      examples: ['beautiful @split']
    });
  }
  async run(message, args) {
    
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

    message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("beautiful", { url: this.getAvatarURL(member) });
        const attachment = new MessageAttachment(buffer, "beautiful.png");

        await message.channel.send({files: [attachment]})
        await msg.delete()
      }
      catch (e) {
        await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
      }
    })
    
  }
};
