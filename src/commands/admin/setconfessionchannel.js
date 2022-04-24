const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class setconfessionchannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setconfessionchannel',
            aliases: ['setconfessions', 'sconfessions', 'setconfessionschannel'],
            usage: 'setconfessionchannel <channel mention/ID>',
            description: oneLine`
        Sets the confessions text channel for your server. This is where confessions will be sent. 
        \nUse \`clearconfessionschannel\` to clear the current \`confessions channel\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setconfessionchannel #general', 'clearconfessionchannel']
        });
    }

    run(message, args) {
        const confessionsChannelID = message.client.db.settings.selectConfessionsChannelId.pluck().get(message.guild.id);
        const oldConfessionsChannel = message.guild.channels.cache.get(confessionsChannelID) || '`None`';
        const embed = new MessageEmbed()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        if (args.length === 0) {
            return message.channel.send({embeds: [embed.addField('Current Confessions Channel', `${oldConfessionsChannel}` || '`None`').setDescription(this.description)]});
        }

        embed.setDescription(`The \`confessions channel\` was successfully updated. ${success}\nUse \`clearconfessionschannel\` to clear the current \`confessions channel\`.`)
        const confessionsChannel = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (!confessionsChannel || (confessionsChannel.type != 'GUILD_TEXT' && confessionsChannel.type != 'GUILD_NEWS') || !confessionsChannel.viewable)
            return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID
      `);
        message.client.db.settings.updateConfessionsChannelId.run(confessionsChannel.id, message.guild.id);
        message.channel.send({embeds: [embed.addField('Confessions Channel', `${oldConfessionsChannel} ➔ ${confessionsChannel}`)]});
    }
};
