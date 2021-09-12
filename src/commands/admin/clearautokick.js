const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine } = require('common-tags');

module.exports = class clearautokickCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'clearautokick',
      aliases: ['clearak', 'cak'],
      usage: 'clearautokick',
      description: oneLine`
        Disables \`auto kick\` when enough warns have been issued.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['clearautokick']
    });
  }
  run(message, args) {
    const autoKick = message.client.db.settings.selectAutoKick.pluck().get(message.guild.id) || 'disabled';

    const embed = new MessageEmbed()
      .setTitle('Settings: `System`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`\`Auto kick\` was successfully disabled. ${success}`)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

      message.client.db.settings.updateAutoKick.run(null, message.guild.id);
      message.channel.send({embeds: [embed.addField('Auto Kick', `\`${autoKick}\` ➔ \`disabled\``)]});
  }
};
