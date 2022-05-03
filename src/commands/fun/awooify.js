const Command = require("../Command.js");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { fail, load } = require("../../utils/emojis.json");

module.exports = class awooifyCommand extends Command {
   constructor(client) {
      super(client, {
         name: "awooify",
         aliases: ["awooo"],
         usage: "awooify <user mention/id>",
         description: "awooify an image",
         type: client.types.FUN,
         examples: ["awooify @split"],
      });
   }

   async run(message, args) {
      const member =
         (await this.getGuildMember(message.guild, args.join(" "))) ||
         message.author;

      message.channel
         .send({
            embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
         })
         .then(async (msg) => {
            try {
               const buffer = await msg.client.nekoApi.generate("awooify", {
                  url: this.getAvatarURL(member, "png"),
               });
               const attachment = new MessageAttachment(buffer, "awooify.png");

               await message.channel.send({ files: [attachment] });
               await msg.delete();
            } catch (e) {
               console.log(e);
               await msg.edit({
                  embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
               });
            }
         });
   }
};
