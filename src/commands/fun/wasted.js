const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class wastedCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'wasted',

      usage: 'wasted <user mention/id>',
      description: 'Generates a wasted image',
      type: client.types.FUN,
      examples: ['wasted @split']
    });
  }
  async run(message, args) {
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

    message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg=>{
      try {
        const buffer = await msg.client.ameApi.generate("wasted", { url: this.getAvatarURL(member) });
        const attachment = new MessageAttachment(buffer, "wasted.png");

        await message.channel.send({files: [attachment]})
        await msg.delete()
      }
      catch (e) {
        await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
      }
    })
  }
};
