const Command = require("../Command.js");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { fail, load } = require("../../utils/emojis.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = class HateCommand extends Command {
   constructor(client) {
      super(client, {
         name: "hate",
         aliases: ["fuck", "allmyhomies", "homies"],
         usage: "hate <text>",
         description:
            'Generates an "all my homies hate" image with provided text',
         type: client.types.FUN,
         examples: [`hate ${client.name} is the best bot!`],
         cooldown: 5,
         slashCommand: new SlashCommandBuilder()
            .setName("hate")
            .setDescription(
               "Generates an 'all my homies hate' image with provided text"
            )
            .addStringOption((option) => {
               return option
                  .setName("text")
                  .setDescription("Text to put in the image")
                  .setRequired(true);
            }),
      });
   }

   async interact(interaction, args) {
      await runHate.call(this, interaction, args, false);
   }

   async run(message, args) {
      await runHate.call(this, message, args, true);
   }
};

/**
 * Run the hate command by responding to the message with an image
 * @param {any} interaction interaction object
 * @param {any} args arguments
 * @param {boolean} [textCommand=false] whether the command is being run as a slash command
 */
async function runHate(interaction, args, textCommand = false) {
   try {
      const text = await interaction.client.utils.replaceMentionsWithNames(
         args.join(" "),
         interaction.guild
      );
      console.log("before image flip");
      const buffer = await interaction.client.utils.generateImgFlipImage(
         242461078,
         `${text}`,
         `${text}`,
         "#EBDBD1",
         "#2E251E"
      );
      console.log("after image flip");
      if (buffer) {
         const attachment = new MessageAttachment(
            buffer,
            "allmyhomieshate.png"
         );

         if (textCommand) {
            await interaction.channel.send({ files: [attachment] });
            await interaction.delete();
         } else {
            await interaction.reply({ files: [attachment] });
         }
      }
   } catch (e) {
      if (textCommand) {
         await interaction.channel.send({
            embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
         });
      } else {
         await interaction.reply({
            embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
         });
      }
   }
}
