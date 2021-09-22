const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetNicknameCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setnickname',
      aliases: ['setnn', 'snn', 'nickname', 'nn', 'changenickname'],
      usage: 'setnickname <user mention/ID> <nickname>',
      description: oneLine`
        Changes the provided user's nickname to the one specified.
        The nickname cannot be larger than 32 characters.
      `,
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_NICKNAMES'],
      userPermissions: ['MANAGE_NICKNAMES'],
      examples: ['setnickname @split Noodles', 'setnickname @split "Val Kilmer"']
    });
  }
  async run(message, args) {
    if (!args[0]) return this.sendHelpMessage(message, `Set Nickname`);
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0])
    if (!member)
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (member.roles.highest.position >= message.member.roles.highest.position && member != message.member)
      return this.sendErrorMessage(message, 0, stripIndent`
        You cannot change the nickname of someone with an equal or higher role
      `);

    if (!args[1]) return this.sendErrorMessage(message, 0, 'Please provide a nickname');
    args.shift()
    // Multi-word nickname
    let nickname = args.join(' ');
    if (!nickname.length) return this.sendErrorMessage(message, 0, 'Please provide a nickname');

    if (nickname.length > 32) {
      return this.sendErrorMessage(message, 0, 'Please ensure the nickname is not longer than 32 characters');
      
    } else {

      try {

        // Change nickname
        const oldNickname = member.nickname || '`None`';
        const nicknameStatus = `${oldNickname} ➔ ${nickname}`;
        await member.setNickname(nickname);
        const embed = new MessageEmbed()
          .setTitle('Set Nickname')
          .setDescription(`${member}'s nickname was successfully updated.`)
          .addField('Moderator', message.member.toString(), true)
          .addField('Member', member.toString(), true)
          .addField('Nickname', nicknameStatus, true)
          .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});

        // Update mod log
        this.sendModLogMessage(message, '', { Member: member, Nickname: nicknameStatus });

      } catch (err) {
        message.client.logger.error(err.stack);
        this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
      }
    }  
  }
};