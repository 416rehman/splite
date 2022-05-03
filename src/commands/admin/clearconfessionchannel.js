const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearconfessionchannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearconfessionchannel',
            aliases: [
                'clearconfessions',
                'cconfessions',
                'clearconfessionschannel',
            ],
            usage: 'clearconfessionchannel',
            description: oneLine`
        Clears the current \`confessions channel\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['clearconfessionchannel'],
        });
    }

    run(message) {
        const embed = new MessageEmbed()
            .setTitle('Settings: `Confessions`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`confessions channel\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        message.client.db.settings.updateConfessionsChannelId.run(
            null,
            message.guild.id
        );
        return message.channel.send({
            embeds: [embed.addField('Confessions Channel', '`None`')],
        });
    }
};
