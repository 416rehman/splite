const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = class AvatarCommand extends Command {
   constructor(client) {
      super(client, {
         name: "avatar",
         aliases: ["profilepic", "pic", "av"],
         usage: "avatar [user mention/ID]",
         description:
            "Displays a user's avatar (or your own, if no user is mentioned).",
         type: client.types.INFO,
         examples: ["avatar @split"],
         slashCommand: new SlashCommandBuilder().addUserOption((option) =>
            option
               .setName("user")
               .setDescription("The user to display the avatar of.")
         ),
      });
   }

   run(message, args) {
      const member =
         this.getMemberFromMention(message, args[0]) ||
         message.guild.members.cache.get(args[0]) ||
         message.member;

      displayAvatar.call(this, member, message);
   }

   async interact(interaction, args) {
      const user = interaction.options.getUser("user") || interaction.member;
      displayAvatar.call(this, user, interaction, true);
   }
};

function displayAvatar(user, context, isInteraction = false) {
   const embed = new MessageEmbed()
      .setAuthor({
         name: this.getUserIdentifier(user),
         iconURL: this.getAvatarURL(user),
      })
      .setDescription(`[Avatar URL](${this.getAvatarURL(user)})`)
      .setTitle(`${this.getUserIdentifier(user)}'s Avatar`)
      .setImage(this.getAvatarURL(user))
      .setFooter({
         text: context.member.displayName,
         iconURL: this.getAvatarURL(context.member),
      })
      .setTimestamp()
      .setColor(user.displayHexColor);

   if (isInteraction) return context.reply({ embeds: [embed] });

   context.channel.send({ embeds: [embed] });
}
