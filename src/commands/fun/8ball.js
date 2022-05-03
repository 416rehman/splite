const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const answers = [
   "It is certain.",
   "It is decidedly so.",
   "Without a doubt.",
   "Yes - definitely.",
   "You may rely on it.",
   "As I see it, yes.",
   "Most likely.",
   "Outlook good.",
   "Yes.",
   "Signs point to yes.",
   "Reply hazy, try again.",
   "Ask again later.",
   "Better not tell you now.",
   "Cannot predict now.",
   "Concentrate and ask again.",
   "Don't count on it.",
   "My reply is no.",
   "My sources say no.",
   "Outlook not so good.",
   "Very doubtful.",
];

module.exports = class EightBallCommand extends Command {
   constructor(client) {
      super(client, {
         name: "8ball",
         aliases: ["fortune"],
         usage: "8ball <question>",
         description: "Asks the Magic 8-Ball for some psychic wisdom.",
         type: client.types.FUN,
         examples: ["8ball Am I going to win the lottery?"],
         slashCommand: new SlashCommandBuilder().addStringOption((option) =>
            option
               .setName("question")
               .setDescription("The question you want the answer to.")
               .setRequired(true)
         ),
      });
   }

   async interact(interaction, args) {
      run8ball.call(this, args, interaction);
   }

   async run(message, args) {
      run8ball.call(this, args, message, true);
   }
};

/**
 * @param {any} args arguments
 * @param {any} interaction interactio object
 * @param {any} isTextCommand
 */
async function run8ball(args, interaction, isTextCommand) {
   let question = "";
   if (isTextCommand) {
      question = args.join(" ");
   } else {
      question = args[0].value;
   }

   if (!question)
      return this.sendErrorMessage(
         interaction,
         0,
         "Please provide a question to ask"
      );

   const embed = new MessageEmbed()
      .setTitle("🎱  The Magic 8-Ball  🎱")
      .addField("Question", question)
      .addField(
         "Answer",
         `${answers[Math.floor(Math.random() * answers.length)]}`
      )
      .setFooter({
         text: interaction.member.displayName,
         iconURL: interaction.author.displayAvatarURL(),
      })
      .setTimestamp()
      .setColor(interaction.guild.me.displayHexColor);

   if (isTextCommand) {
      await interaction.channel.send({ embeds: [embed] });
   } else {
      await interaction.reply({ embeds: [embed] });
   }
}
