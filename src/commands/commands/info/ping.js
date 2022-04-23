const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const {pong} = require('../../../utils/emojis.json');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            usage: 'ping',
            description: `Gets ${client.name}\'s current latency and API latency.`,
            type: client.types.INFO
        });
    }

    async run(message, args) {
        const embed = new MessageEmbed()
            .setDescription('`Pinging...`')
            .setColor(message.guild.me.displayHexColor);
        const msg = await message.channel.send({embeds: [embed]});
        const timestamp = (message.editedTimestamp) ? message.editedTimestamp : message.createdTimestamp; // Check if edited
        const latency = `\`\`\`ini\n[ ${Math.floor(msg.createdTimestamp - timestamp)}ms ]\`\`\``;
        const apiLatency = `\`\`\`ini\n[ ${Math.round(message.client.ws.ping)}ms ]\`\`\``;
        embed.setTitle(`Pong!  ${pong}`)
            .setDescription('')
            .addField('Latency', latency, true)
            .addField('API Latency', apiLatency, true)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();
        msg.edit({embeds: [embed]});
    }
};
