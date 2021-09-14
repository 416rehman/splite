const Command = require('../../Command.js');
const { ReactionMenu } = require('../../ReactionMenu.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment')

module.exports = class ServersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'servers',
      aliases: ['servs'],
      usage: 'servers',
      description: `Displays a list of ${client.name}\'s joined servers.`,
      type: client.types.OWNER,
      ownerOnly: true
    });
  }
  run(message, args) {
    const servers = [...message.client.guilds.cache.values()].sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).map(guild => {
      return `\`${guild.id}\` - \`${guild.members.cache.size}\` - **${guild.name}** - ${moment(guild.me.joinedAt).fromNow()}`;
    });
    servers.sort()

    const embed = new MessageEmbed()
      .setTitle('Server List')
      .setFooter(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    if (servers.length <= 10) {
      const range = (servers.length == 1) ? '[1]' : `[1 - ${servers.length}]`;
      message.channel.send({embeds: [embed.setTitle(`Server List ${range}`).setDescription(servers.join('\n'))]});
    } else {
      new ReactionMenu(message.client, message.channel, message.member, embed, servers);
    }
  }
};
