const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class SetAutoKickCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setautokick',
            aliases: ['setak', 'sak'],
            usage: 'setautokick <warn count>',
            description: oneLine`
        Sets the amount of warns needed before ${client.name} will automatically kick someone from your server.\nUse \`clearautokick\` to disable \`auto kick\`.
      `,
            type: client.types.ADMIN,
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setautokick 3', 'clearautokick']
        });
    }

    run(message, args) {

        const autoKick = message.client.db.settings.selectAutoKick.pluck().get(message.guild.id) || 'disabled';
        const amount = args[0];
        if (amount && (!Number.isInteger(Number(amount)) || amount < 0))
            return this.sendErrorMessage(message, 0, 'Please enter a positive integer');

        const embed = new MessageEmbed()
            .setTitle('Settings: `System`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))

            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        if (args.length === 0 || amount == 0) {
            return message.channel.send({embeds: [embed.addField('Current Auto Kick', `\`${autoKick}\``).setDescription(this.description)]});
        }
        embed.setDescription(`\`Auto kick\` was successfully updated. ${success}\nUse \`clearautokick\` to disable \`auto kick\``)
        message.client.db.settings.updateAutoKick.run(amount, message.guild.id);
        message.channel.send({embeds: [embed.addField('Auto Kick', `\`${autoKick}\` ➔ \`${amount}\``)]});
    }
};
