const Command = require("../Command.js");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { fail, load } = require("../../utils/emojis.json");

module.exports = class sniperCommand extends Command {
   constructor(client) {
      super(client, {
         name: "sniper",

         usage: "sniper <user mention/id>",
         description: "Generates a sniper image",
         type: client.types.FUN,
         examples: ["sniper @split"],
      });
   }

   async run(message, args) {
      const member =
         (await this.getMemberFromMention(message, args[0])) ||
         (await message.guild.members.cache.get(args[0])) ||
         message.author;

      message.channel
         .send({
            embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
         })
         .then(async (msg) => {
            try {
               const buffer = await msg.client.ameApi.generate("sniper", {
                  url: this.getAvatarURL(member, "png"),
               });
               const attachment = new MessageAttachment(buffer, "sniper.png");

               await message.channel.send({ files: [attachment] });
               await msg.delete();
            } catch (e) {
               await msg.edit({
                  embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
               });
            }
         });
   }
};
