const Command = require("../Command.js");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { fail, load } = require("../../utils/emojis.json");

module.exports = class greyscaleCommand extends Command {
   constructor(client) {
      super(client, {
         name: "greyscale",
         aliases: ["grey"],
         usage: "greyscale <user mention/id>",
         description: "Generates a greyscale image",
         type: client.types.FUN,
         examples: ["greyscale @split"],
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
               const buffer = await msg.client.ameApi.generate("greyscale", {
                  url: this.getAvatarURL(member, "png"),
               });
               const attachment = new MessageAttachment(
                  buffer,
                  "greyscale.png"
               );

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
