const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {pong} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            usage: 'ping',
            description: `Gets ${client.name}'s current latency and API latency.`,
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    async handle(context) {
        const embed = new MessageEmbed()
            .setDescription('`Pinging...`')
            .setColor('RANDOM');

        let msg;
        let payload = {embeds: [embed]};
        msg = await this.sendReply(context, payload);

        const timestamp = context.editedTimestamp
            ? context.editedTimestamp
            : context.createdTimestamp; // Check if edited
        const latency = `\`\`\`ini\n[ ${Math.floor(
            msg.createdTimestamp - timestamp
        )}ms ]\`\`\``;
        const apiLatency = `\`\`\`ini\n[ ${Math.round(
            this.client.ws.ping
        )}ms ]\`\`\``;
        embed
            .setTitle(`Pong!  ${pong}`)
            .setDescription('')
            .addField('Latency', latency, true)
            .addField('API Latency', apiLatency, true)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        payload = {embeds: [embed]};
        msg.edit(payload);
    }
};
