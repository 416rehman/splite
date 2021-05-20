const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');
const { confirm } = require("djs-reaction-collector")

module.exports = class SoftBanCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'softban',
      usage: 'softban <user mention/ID> [reason]',
      description: oneLine`
        Softbans a member from your server (bans then immediately unbans).
        This wipes all messages from that member from your server.      
      `,
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'],
      userPermissions: ['BAN_MEMBERS'],
      examples: ['softban @split']
    });
  }
  async run(message, args) {
    if (!args[0]) return this.sendHelpMessage(message);
    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (member === message.member) 
      return this.sendErrorMessage(message, 0, 'You cannot softban yourself'); 
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return this.sendErrorMessage(message, 0, 'You cannot softban someone with an equal or higher role');
    if (!member.bannable)
      return this.sendErrorMessage(message, 0, 'Provided member is not bannable');

    let reason = args.slice(1).join(' ');
    if (!reason) reason = '`None`';
    if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

    message.channel.send(new MessageEmbed().setTitle('Softban Member')
        .setDescription(`Do you want to softban ${member}?`)).then(async msg=> {
      const reactions = await confirm(msg, message.author, ["✅", "❌"], 10000);

      if (reactions === '✅') {
        await member.ban({reason: reason});
        await message.guild.members.unban(member.user, reason);

        const embed = new MessageEmbed()
            .setTitle('Softban Member')
            .setDescription(`${member} was successfully softbanned.`)
            .addField('Moderator', message.member, true)
            .addField('Member', member, true)
            .addField('Reason', reason)
            .setFooter(message.member.displayName, message.author.displayAvatarURL({dynamic: true}))
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        msg.edit(embed);
        message.client.logger.info(`${message.guild.name}: ${message.author.tag} softbanned ${member.user.tag}`);

        // Update mod log
        await this.sendModLogMessage(message, reason, {Member: member});
      }
      else await msg.delete();
    })
  }
};
