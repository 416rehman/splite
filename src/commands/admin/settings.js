const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { stripIndent, oneLine } = require("common-tags");

module.exports = class SettingsCommand extends Command {
   constructor(client) {
      super(client, {
         name: "settings",
         aliases: ["set", "config", "conf"],
         usage: "settings [category]",
         description: oneLine`
        Displays a list of all current settings for the given setting category. 
        If no category is given, the amount of settings for every category will be displayed.
      `,
         type: client.types.ADMIN,
         userPermissions: ["MANAGE_GUILD"],
         examples: ["settings System"],
      });
   }

   run(message, args) {
      const { trimArray, replaceKeywords, replaceCrownKeywords } =
         message.client.utils;

      // Set values
      const row = message.client.db.settings.selectRow.get(message.guild.id);

      const prefix = `\`${row.prefix}\``;
      const systemChannel =
         message.guild.channels.cache.get(row.system_channel_id) || "`None`";
      const joinVotingChannel =
         message.guild.channels.cache.get(row.voting_channel_id) || "`None`";
      const joinVotingMessage = row.joinvoting_message_id || "`None`";
      //Emoji
      let joinVotingEmoji =
         message.client.utils.getEmojiForJoinVoting(
            message.guild,
            message.client
         ) || "`None`";

      const confessionChannel =
         message.guild.channels.cache.get(row.confessions_channel_id) ||
         "`None`";
      const starboardChannel =
         message.guild.channels.cache.get(row.starboard_channel_id) || "`None`";
      const modLog =
         message.guild.channels.cache.get(row.mod_log_id) || "`None`";
      const memberLog =
         message.guild.channels.cache.get(row.member_log_id) || "`None`";
      const nicknameLog =
         message.guild.channels.cache.get(row.nickname_log_id) || "`None`";
      const roleLog =
         message.guild.channels.cache.get(row.role_log_id) || "`None`";
      const messageEditLog =
         message.guild.channels.cache.get(row.message_edit_log_id) || "`None`";
      const messageDeleteLog =
         message.guild.channels.cache.get(row.message_delete_log_id) ||
         "`None`";
      const verificationChannel =
         message.guild.channels.cache.get(row.verification_channel_id) ||
         "`None`";
      const welcomeChannel =
         message.guild.channels.cache.get(row.welcome_channel_id) || "`None`";
      const farewellChannel =
         message.guild.channels.cache.get(row.farewell_channel_id) || "`None`";
      const crownChannel =
         message.guild.channels.cache.get(row.crown_channel_id) || "`None`";
      let modChannels = [];
      if (row.mod_channel_ids) {
         for (const channel of row.mod_channel_ids.split(" ")) {
            modChannels.push(
               message.guild.channels.cache.get(channel).toString()
            );
         }
         modChannels = trimArray(modChannels).join(" ");
      }
      if (modChannels.length === 0) modChannels = "`None`";
      const adminRole =
         message.guild.roles.cache.get(row.admin_role_id) || "`None`";
      const modRole =
         message.guild.roles.cache.get(row.mod_role_id) || "`None`";
      const muteRole =
         message.guild.roles.cache.get(row.mute_role_id) || "`None`";
      const autoRole =
         message.guild.roles.cache.get(row.auto_role_id) || "`None`";
      const verificationRole =
         message.guild.roles.cache.get(row.verification_role_id) || "`None`";
      const crownRole =
         message.guild.roles.cache.get(row.crown_role_id) || "`None`";
      const autoKick = row.auto_kick
         ? `After \`${row.auto_kick}\` warn(s)`
         : "`disabled`";
      const messagePoints = `\`${row.message_points}\``;
      const commandPoints = `\`${row.command_points}\``;
      const voicePoints = `\`${row.voice_points}\``;
      let verificationMessage = row.verification_message
         ? replaceKeywords(row.verification_message)
         : "`None`";
      let welcomeMessage = row.welcome_message
         ? replaceKeywords(row.welcome_message)
         : "`None`";
      let farewellMessage = row.farewell_message
         ? replaceKeywords(row.farewell_message)
         : "`None`";
      let crownMessage = row.crown_message
         ? replaceCrownKeywords(row.crown_message)
         : "`None`";
      const crownSchedule = row.crown_schedule
         ? `\`${row.crown_schedule}\``
         : "`None`";
      let disabledCommands = "`None`";
      if (row.disabled_commands)
         disabledCommands = row.disabled_commands
            .split(" ")
            .map((c) => `\`${c}\``)
            .join(" ");

      // Get statuses
      const verificationStatus = `\`${message.client.utils.getStatus(
         row.verification_role_id &&
            row.verification_channel_id &&
            row.verification_message
      )}\``;
      const randomColor = `\`${message.client.utils.getStatus(
         row.random_color
      )}\``;
      const welcomeStatus = `\`${message.client.utils.getStatus(
         row.welcome_message && row.welcome_channel_id
      )}\``;
      const farewellStatus = `\`${message.client.utils.getStatus(
         row.farewell_message && row.farewell_channel_id
      )}\``;
      const pointsStatus = `\`${message.client.utils.getStatus(
         row.point_tracking
      )}\``;
      const crownStatus = `\`${message.client.utils.getStatus(
         row.crown_role_id && row.crown_schedule
      )}\``;
      const anonymous = `\`${message.client.utils.getStatus(row.anonymous)}\``;
      const joinVotingStatus = `\`${message.client.utils.getStatus(
         row.joinvoting_message_id &&
            row.voting_channel_id &&
            row.joinvoting_emoji
      )}\``;

      // Trim messages to 1024 characters
      if (verificationMessage.length > 1024)
         verificationMessage = verificationMessage.slice(0, 1021) + "...";
      if (welcomeMessage.length > 1024)
         welcomeMessage = welcomeMessage.slice(0, 1021) + "...";
      if (farewellMessage.length > 1024)
         farewellMessage = farewellMessage.slice(0, 1021) + "...";
      if (crownMessage.length > 1024)
         crownMessage = crownMessage.slice(0, 1021) + "...";

      /** ------------------------------------------------------------------------------------------------
       * CATEGORY CHECKS
       * ------------------------------------------------------------------------------------------------ */
      let setting = args.join("").toLowerCase();
      if (setting.endsWith("setting")) setting = setting.slice(0, -7);
      const embed = new MessageEmbed()
         .setThumbnail(message.guild.iconURL({ dynamic: true }))
         .setFooter({
            text: message.member.displayName,
            iconURL: message.author.displayAvatarURL(),
         })
         .setTimestamp()
         .setColor(message.guild.me.displayHexColor);
      switch (setting) {
         case "s":
         case "sys":
         case "system":
            return message.channel.send({
               embeds: [
                  embed
                     .setTitle("Settings: `System`")
                     .addField("Prefix", prefix, true)
                     .addField("System Channel", systemChannel.toString(), true)
                     .addField(
                        "Starboard Channel",
                        starboardChannel.toString(),
                        true
                     )
                     .addField("Admin Role", adminRole.toString(), true)
                     .addField("Mod Role", modRole.toString(), true)
                     .addField("Mute Role", muteRole.toString(), true)
                     .addField("Auto Role", autoRole.toString(), true)
                     .addField("Auto Kick", autoKick.toString(), true)
                     .addField("Random Color", randomColor, true)
                     .addField("Anonymous Messages", anonymous, true)
                     .addField(
                        "Confessions Channel",
                        confessionChannel.toString(),
                        true
                     )
                     .addField("Mod Channels", modChannels)
                     .addField("Disabled Commands", disabledCommands),
               ],
            });
         case "l":
         case "log":
         case "logs":
         case "logging":
            return message.channel.send({
               embeds: [
                  embed
                     .setTitle("Settings: `Logging`")
                     .addField("Mod Log", modLog.toString(), true)
                     .addField("Member Log", memberLog.toString(), true)
                     .addField("Nickname Log", nicknameLog.toString(), true)
                     .addField("Role Log", roleLog.toString(), true)
                     .addField(
                        "Message Edit Log",
                        messageEditLog.toString(),
                        true
                     )
                     .addField(
                        "Message Delete Log",
                        messageDeleteLog.toString(),
                        true
                     ),
               ],
            });
         case "v":
         case "ver":
         case "verif":
         case "verification":
            embed
               .setTitle("Settings: `Verification`")
               .addField("Role", verificationRole.toString(), true)
               .addField("Channel", verificationChannel.toString(), true)
               .addField("Status", verificationStatus.toString(), true)
               .addField("Message", verificationMessage.toString());
            return message.channel.send({ embeds: [embed] });
         case "w":
         case "welcome":
         case "welcomes":
            embed
               .setTitle("Settings: `Welcomes`")
               .addField("Channel", welcomeChannel.toString(), true)
               .addField("Status", welcomeStatus, true)
               .addField("Message", welcomeMessage);
            return message.channel.send({ embeds: [embed] });
         case "f":
         case "farewell":
         case "farewells":
            embed
               .setTitle("Settings: `Farewells`")
               .addField("Channel", farewellChannel.toString(), true)
               .addField("Status", farewellStatus, true)
               .addField("Message", farewellMessage);
            return message.channel.send({ embeds: [embed] });
         case "p":
         case "point":
         case "points":
            return message.channel.send({
               embeds: [
                  embed
                     .setTitle("Settings: `Points`")
                     .addField("Message Points", messagePoints, true)
                     .addField("Command Points", commandPoints, true)
                     .addField("Voice Points", voicePoints, true)
                     .addField("Status", pointsStatus),
               ],
            });
         case "c":
         case "crown":
            embed
               .setTitle("Settings: `Crown`")
               .addField("Role", crownRole.toString(), true)
               .addField("Channel", crownChannel.toString(), true)
               .addField("Schedule", crownSchedule, true)
               .addField("Status", crownStatus)
               .addField("Message", crownMessage);
            return message.channel.send({ embeds: [embed] });
         case "j":
         case "join":
         case "joinvote":
         case "joinvoting":
            return message.channel.send({
               embeds: [
                  embed
                     .setTitle("Settings: `Join Voting`")
                     .addField("Status", joinVotingStatus)
                     .addField("Reaction", joinVotingEmoji, true)
                     .addField("MessageID", joinVotingMessage, true)
                     .addField(
                        "Vote Broadcast Channel",
                        joinVotingChannel.toString(),
                        true
                     ),
               ],
            });
      }
      if (setting)
         return this.sendErrorMessage(
            message,
            0,
            stripIndent`
        Please enter a valid settings category, use ${row.prefix}settings for a list
      `
         );

      /** ------------------------------------------------------------------------------------------------
       * FULL SETTINGS
       * ------------------------------------------------------------------------------------------------ */

      embed
         .setTitle("Settings")
         .setDescription(
            `**More Information:** \`${row.prefix}settings [category]\``
         )
         .addField("System", "`13` settings", true)
         .addField("Logging", "`6` settings", true)
         .addField("Verification", "`3` settings", true)
         .addField("Welcomes", "`2` settings", true)
         .addField("Farewells", "`2` settings", true)
         .addField("Points", "`3` settings", true)
         .addField("Crown", "`4` settings", true)
         .addField("JoinVoting", "`3` settings", true)
         .addField("Invite Me", `[Click Here](${message.client.link})`, true);
      message.channel.send({ embeds: [embed] });
   }
};
